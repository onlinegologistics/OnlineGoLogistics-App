const mongoose = require('mongoose');

const agentParcelRequestSchema = mongoose.Schema({
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    senderName: { type: String, required: true },
    senderMobile: { type: String, required: true },
    senderAddress: { type: String },
    receiverName: { type: String, required: true },
    receiverMobile: { type: String, required: true },
    receiverAddress: { type: String },
    packageDescription: { type: String },
    weight: { type: Number },
    quantity: { type: Number, default: 1 },
    remarks: { type: String },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
    rejectionReason: { type: String },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    reviewedAt: { type: Date },
}, {
    timestamps: true,
});

const AgentParcelRequest = mongoose.model('AgentParcelRequest', agentParcelRequestSchema);
module.exports = AgentParcelRequest;
