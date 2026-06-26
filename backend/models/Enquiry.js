const mongoose = require('mongoose');

const enquirySchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    name: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
        default: 'Open',
    },
    adminResponse: {
        type: String,
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Enquiry', enquirySchema);
