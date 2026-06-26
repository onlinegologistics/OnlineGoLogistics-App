const mongoose = require('mongoose');

const pickupAddressSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    isPrimary: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

const PickupAddress = mongoose.model('PickupAddress', pickupAddressSchema);

module.exports = PickupAddress;
