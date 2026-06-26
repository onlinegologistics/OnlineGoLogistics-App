const mongoose = require('mongoose');
const MobileUser = require('../models/MobileUser');

// @desc    Track shipment by tracking ID
// @route   GET /api/shipments/track/:trackingId
// @access  Public
const trackShipment = async (req, res) => {
    try {
        const { trackingId } = req.params;
        console.log("Requested trackingId:", trackingId);

        const db = mongoose.connection.db;
        const trimmedId = trackingId.trim();
        const { ObjectId } = require('mongodb');

        let query = {};

        // 1. If it's a valid MongoDB ObjectId
        if (mongoose.Types.ObjectId.isValid(trimmedId)) {
            query = {
                $or: [
                    { _id: new ObjectId(trimmedId) },
                    { parcelRequestId: trimmedId },
                    { parcelRequestId: new ObjectId(trimmedId) },
                    { trackingId: { $regex: new RegExp(`^${trimmedId}$`, 'i') } }
                ]
            };
        } 
        // 2. If it is a booking ID format like ONL-XXXXXX
        else if (/^ONL-[0-9A-Fa-f]{6}$/i.test(trimmedId)) {
            const suffix = trimmedId.substring(4);
            query = {
                $or: [
                    { trackingId: { $regex: new RegExp(`^${trimmedId}$`, 'i') } }
                ]
            };
        } 
        // 3. Fallback
        else {
            query = {
                $or: [
                    { trackingId: { $regex: new RegExp(`^${trimmedId}$`, 'i') } },
                    { parcelRequestId: { $regex: new RegExp(`^${trimmedId}$`, 'i') } }
                ]
            };
        }

        let shipment = await MobileUser.findOne(query);

        // Additional suffix fallback (ONL-XXXXXX) matching parcelRequestId or _id suffix
        if (!shipment && /^ONL-[0-9A-Fa-f]{6}$/i.test(trimmedId)) {
            const suffix = trimmedId.substring(4).toLowerCase();
            shipment = await MobileUser.findOne({
                $expr: {
                    $or: [
                        { $eq: [ { $substr: [ { $toString: "$_id" }, 18, 6 ] }, suffix ] },
                        { $eq: [ { $substr: [ { $toString: "$parcelRequestId" }, 18, 6 ] }, suffix ] }
                    ]
                }
            });
        }

        if (!shipment) {
            console.log("Shipment not found for trackingId:", trackingId);
            return res.status(404).json({ success: false, message: 'Shipment not found' });
        }

        console.log("Found shipment:", shipment);
        res.json({
            success: true,
            data: shipment
        });
    } catch (error) {
        console.error("Error in trackShipment:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { trackShipment };
