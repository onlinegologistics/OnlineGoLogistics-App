const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MobileUser',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['shipment', 'enquiry', 'complaint'],
        required: true,
    },
    referenceId: {
        type: String,
        required: true,
    },
    read: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
