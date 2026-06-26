const mongoose = require('mongoose');

const mobileUserComplaintSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MobileUser',
        required: true,
    },
    name: {
        type: String,
        required: true,
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
        default: 'Pending',
    },
}, {
    timestamps: true,
    collection: 'mobileuser_complaints',
});

const MobileUserComplaint = mongoose.model('MobileUserComplaint', mobileUserComplaintSchema);

module.exports = MobileUserComplaint;
