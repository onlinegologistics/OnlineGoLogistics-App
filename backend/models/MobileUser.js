const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mobileUserSchema = mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        default: 'mobile',
    },
    email: { type: String },
    mobile: { type: String },
    alternateMobile: { type: String },
    address: { type: String },
    company: { type: String },
    isActive: { type: Boolean, default: true },
    otp: { type: String },
    otpExpiry: { type: Date },
    pickupAddress: { type: String },
    deliveryAddress: { type: String },
    packageDescription: { type: String },
    parcelType: { type: String },
    weight: { type: Number },
    quantity: { type: Number },
    remarks: { type: String },
    pickupCity: { type: String },
    deliveryCity: { type: String },
    transportType: { type: String },
    expectedDeliveryDate: { type: Date },
    parcelRequestId: { type: mongoose.Schema.Types.ObjectId },
    customer: { type: mongoose.Schema.Types.ObjectId },
    customerName: { type: String },
    mobileNumber: { type: String },
    currentBranch: { type: String },
    currentLocation: { type: String },
    currentStatus: { type: String },
    trackingId: { type: String },
    assignedStaff: { type: String },
    trackingHistory: { type: Array, default: [] },
    profilePhoto: { type: String },
}, { timestamps: true, collection: 'mobileusers' });

mobileUserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

mobileUserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const MobileUser = mongoose.model('MobileUser', mobileUserSchema);
module.exports = MobileUser;
