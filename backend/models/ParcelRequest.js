const mongoose = require('mongoose');

const parcelRequestSchema = mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    pickupAddress: {
        type: String,
        required: true,
    },
    customerName: {
        type: String,
    },
    mobileNumber: {
        type: String,
    },
    pickupCity: {
        type: String,
    },
    deliveryAddress: {
        type: String,
        required: true,
    },
    deliveryCity: {
        type: String,
    },
    pickupDate: {
        type: Date,
    },
    expectedDeliveryDate: {
        type: Date,
    },
    parcelType: {
        type: String,
    },
    transportType: {
        type: String,
    },
    packageDescription: {
        type: String,
    },
    weight: {
        type: Number,
    },
    quantity: {
        type: Number,
        default: 1,
    },
    remarks: {
        type: String,
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled'],
        default: 'Pending',
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

const ParcelRequest = mongoose.model('ParcelRequest', parcelRequestSchema);

module.exports = ParcelRequest;
