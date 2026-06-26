const Luggage = require('../models/Luggage');
const Counter = require('../models/Counter');
const mongoose = require('mongoose');

// @desc    Create new luggage entry
// @route   POST /api/luggage
// @access  Private
const createLuggage = async (req, res) => {
    try {
        let { ewayBillNo, manualLrNo } = req.body;

        if (!ewayBillNo) {
            // Generate simple unique E-way Bill No: EWB + Timestamp + Random
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(1000 + Math.random() * 9000);
            ewayBillNo = `EWB${timestamp}${random}`;
        }

        // Auto-generate Bill No (manualLrNo) if not provided
        if (!manualLrNo) {
            const counter = await Counter.findOneAndUpdate(
                { id: 'luggageBillNo' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true } // Create if not exists
            );
            manualLrNo = `ONL-${counter.seq}`;
        }

        const luggage = new Luggage({
            ...req.body,
            ewayBillNo,
            manualLrNo,
            createdBy: req.user._id,
        });

        const createdLuggage = await luggage.save();

        // Check if mobile_user collection exists in the database
        const db = mongoose.connection.db;
        const collections = await db.listCollections({ name: 'mobile_user' }).toArray();
        if (collections.length === 0) {
            await db.createCollection('mobile_user');
        }

        // Insert all form data into mobile_user collection
        await db.collection('mobile_user').insertOne({
            ...req.body,
            ewayBillNo,
            manualLrNo,
            luggageId: createdLuggage._id,
            createdBy: req.user._id,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.status(201).json(createdLuggage);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all luggage entries
// @route   GET /api/luggage
// @access  Private (Admin sees all, User sees ?) - User request says "Admin can view all luggage entries", "User can only add". 
// Usually User implies they can add, maybe view their own or all? Let's assume Admin sees all, User sees all (or maybe just recent). 
// Requirement: "Admin dashboard... table listing all". "User can only add". 
// Let's implement getAll for Admin.
const getLuggage = async (req, res) => {
    const { keyword, startDate, endDate, station, userId } = req.query;

    // Build query
    let query = {};

    // If not admin, only show own entries (created by them OR assigned to them as customer)
    if (req.user.role !== 'admin') {
        const userId = req.user._id;
        query.$or = [
            { createdBy: userId },
            { customer: userId }
        ];
    } else if (userId) {
        query.createdBy = userId;
    }

    if (keyword) {
        query.$or = [
            { senderName: { $regex: keyword, $options: 'i' } },
            { receiverName: { $regex: keyword, $options: 'i' } },
            { manualLrNo: { $regex: keyword, $options: 'i' } },
        ];
    }

    if (startDate && endDate) {
        query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
        }
    }

    if (station) {
        query.station = station;
    }

    try {
        const luggage = await Luggage.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        res.json(luggage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get luggage by ID
// @route   GET /api/luggage/:id
// @access  Private
const getLuggageById = async (req, res) => {
    const luggage = await Luggage.findById(req.params.id);

    if (luggage) {
        res.json(luggage);
    } else {
        res.status(404).json({ message: 'Luggage not found' });
    }
};

// @desc    Delete luggage
// @route   DELETE /api/luggage/:id
// @access  Private/Admin
const deleteLuggage = async (req, res) => {
    const luggage = await Luggage.findById(req.params.id);

    if (luggage) {
        await luggage.deleteOne();
        res.json({ message: 'Luggage removed' });
    } else {
        res.status(404).json({ message: 'Luggage not found' });
    }
};

// @desc    Update luggage
// @route   PUT /api/luggage/:id
// @access  Private/Admin
const updateLuggage = async (req, res) => {
    const luggage = await Luggage.findById(req.params.id);

    if (luggage) {
        Object.assign(luggage, req.body);
        const updatedLuggage = await luggage.save();
        res.json(updatedLuggage);
    } else {
        res.status(404).json({ message: 'Luggage not found' });
    }
};

module.exports = {
    createLuggage,
    getLuggage,
    getLuggageById,
    deleteLuggage,
    updateLuggage,
};
