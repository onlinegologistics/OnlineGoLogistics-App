const mongoose = require('mongoose');

const creditOfficeSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    address: {
        type: String,
    },
    mobile: {
        type: String,
    },
    gst: {
        type: String,
    },
    // Pricing Configuration
    boxPrice: {
        type: Number,
        default: 180
    },
    goniPrice: {
        type: Number,
        default: 0
    },
    parcelPrice: {
        type: Number,
        default: 0
    },
    otherPrice: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const CreditOffice = mongoose.model('CreditOffice', creditOfficeSchema);

module.exports = CreditOffice;
