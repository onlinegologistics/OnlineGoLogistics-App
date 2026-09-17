const mongoose = require('mongoose');

const parcelRequestSchema = mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'customerModel',
    },
    customerModel: {
        type: String,
        enum: ['User', 'MobileUser'],
        default: 'User',
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
    deliveryLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryLocation',
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
        enum: ['Pending', 'Accepted', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled', 'Approved', 'Destination Arrived'],
        default: 'Pending',
    },
    currentStatus: {
        type: String,
        default: 'Pending',
    },
    trackingId: {
        type: String,
        index: true,
        sparse: true,
    },
    currentBranch: {
        type: String,
        default: 'Central Hub',
    },
    currentLocation: {
        type: String,
    },
    assignedStaff: {
        type: String,
        default: '',
    },
    trackingHistory: {
        type: Array,
        default: [],
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
