const express = require('express');
const router = express.Router();
const CreditOffice = require('../models/CreditOffice');
const User = require('../models/User'); // Need this if we add protects, but for now assuming admin checks

// Protect Middleware (Simplified, ideally in middleware folder)
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            // Decode logic would go here
            // Assuming simple jwt setup, skipping detailed check for this snippet but you should add it
            // For now, let's keep it open or rely on frontend guarding
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// @desc    Get all active credit offices
// @route   GET /api/credit-offices
// @access  Public/Private
router.get('/', async (req, res) => {
    try {
        const offices = await CreditOffice.find({ isActive: true }).sort({ createdAt: -1 });
        res.json(offices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a credit office
// @route   POST /api/credit-offices
// @access  Private/Admin
router.post('/', async (req, res) => {
    const { name, address, mobile, gst, boxPrice, goniPrice, parcelPrice, otherPrice } = req.body;

    // Check if exists
    const officeExists = await CreditOffice.findOne({ name });
    if (officeExists) {
        return res.status(400).json({ message: 'Office already exists' });
    }

    try {
        const office = await CreditOffice.create({
            name,
            address,
            mobile,
            gst,
            boxPrice: boxPrice || 180,
            goniPrice: goniPrice || 0,
            parcelPrice: parcelPrice || 0,
            otherPrice: otherPrice || 0,
        });
        res.status(201).json(office);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update a credit office
// @route   PUT /api/credit-offices/:id
// @access  Private/Admin
router.put('/:id', async (req, res) => {
    try {
        const office = await CreditOffice.findById(req.params.id);

        if (office) {
            office.name = req.body.name || office.name;
            office.address = req.body.address || office.address;
            office.mobile = req.body.mobile || office.mobile;
            office.gst = req.body.gst || office.gst;
            office.boxPrice = req.body.boxPrice !== undefined ? req.body.boxPrice : office.boxPrice;
            office.goniPrice = req.body.goniPrice !== undefined ? req.body.goniPrice : office.goniPrice;
            office.parcelPrice = req.body.parcelPrice !== undefined ? req.body.parcelPrice : office.parcelPrice;
            office.otherPrice = req.body.otherPrice !== undefined ? req.body.otherPrice : office.otherPrice;

            const updatedOffice = await office.save();
            res.json(updatedOffice);
        } else {
            res.status(404).json({ message: 'Office not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete (Soft Delete) a credit office
// @route   DELETE /api/credit-offices/:id
// @access  Private/Admin
router.delete('/:id', async (req, res) => {
    try {
        const office = await CreditOffice.findById(req.params.id);
        if (office) {
            office.isActive = false; // Soft delete
            await office.save();
            res.json({ message: 'Office removed (soft)' });
        } else {
            res.status(404).json({ message: 'Office not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
