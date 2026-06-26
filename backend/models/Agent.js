const mongoose = require('mongoose');

const agentSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    mobile: {
        type: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true,
});

const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent;
