const mongoose = require('mongoose');

const complaintSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: false, // Made optional for guest users
        ref: 'User',
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    contactName: {
        type: String, // For guest users
    },
    contactMobile: {
        type: String, // For guest users
    },
    receiptNo: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
        default: 'Open',
    },
    priority: {
        type: String,
        required: true,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium',
    },
    adminResponse: {
        type: String,
    }
}, {
    timestamps: true,
});

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
