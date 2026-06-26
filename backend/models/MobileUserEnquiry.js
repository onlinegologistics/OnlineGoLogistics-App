const mongoose = require('mongoose');

const mobileUserEnquirySchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MobileUser',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    enquiryType: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: 'Pending',
    },
}, {
    timestamps: true,
    collection: 'mobileuser_enquiry',
});

const MobileUserEnquiry = mongoose.model('MobileUserEnquiry', mobileUserEnquirySchema);

module.exports = MobileUserEnquiry;
