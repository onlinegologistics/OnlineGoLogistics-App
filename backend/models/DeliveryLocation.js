const mongoose = require('mongoose');

const deliveryLocationSchema = mongoose.Schema({
    city: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

const DeliveryLocation = mongoose.model('DeliveryLocation', deliveryLocationSchema);

module.exports = DeliveryLocation;
