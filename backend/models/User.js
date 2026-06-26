const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'branch', 'user', 'customer', 'agent'],
        default: 'user',
    },
    createdByUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    email: { type: String },
    mobile: { type: String },
    address: { type: String },
    company: { type: String },
    isActive: { type: Boolean, default: true },
    otp: { type: String },
    otpExpiry: { type: Date },
    pickupAddress: { type: String },
    customerName: { type: String },
    mobileNumber: { type: String },
    currentLocation: { type: String },
    currentStatus: { type: String },
    trackingHistory: { type: Array, default: [] },
}, { timestamps: true, collection: 'users' });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
