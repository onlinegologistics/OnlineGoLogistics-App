const mongoose = require('mongoose');

const otpVerificationSchema = mongoose.Schema({
    purpose: {
        type: String,
        enum: ['registration', 'login'],
        required: true,
    },
    mobile: {
        type: String,
        required: true,
    },
    email: {
        type: String,
    },
    otp: {
        type: String,
        required: true,
    },
    payload: {
        type: mongoose.Schema.Types.Mixed,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 },
    },
}, { timestamps: true });

module.exports = mongoose.model('OtpVerification', otpVerificationSchema);
