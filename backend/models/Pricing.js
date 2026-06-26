const mongoose = require('mongoose');

const pricingSchema = mongoose.Schema({
    type: {
        type: String,
        default: 'GLOBAL',
        unique: true
    },
    categories: [{
        name: { type: String, required: true },
        price: { type: Number, default: 0 }
    }]
}, {
    timestamps: true
});

const Pricing = mongoose.model('Pricing', pricingSchema);

module.exports = Pricing;
