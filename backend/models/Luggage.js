const mongoose = require('mongoose');

const luggageSchema = mongoose.Schema({
    // Sender Details
    senderName: { type: String, required: true },
    senderAddress: { type: String },
    senderMobile: { type: String },
    senderGst: { type: String },

    // Receiver Details
    receiverName: { type: String, required: true },
    receiverAddress: { type: String },
    receiverMobile: { type: String },
    receiverGst: { type: String },

    // Shipment Details
    station: { type: String, required: true }, // Destination Station
    paymentMode: {
        type: String,
        required: true,
        enum: ['Paid', 'ToPay', 'Credit', 'FOC']
    },
    creditParty: { type: String }, // Only if Credit
    creditOffice: { type: String }, // Credit Party / Credit Office

    // Agent
    agent: { type: String },

    // Goods Details
    noOfParcels: { type: Number, required: true },
    unit: { type: String, default: 'PKG' },
    weight: { type: Number },
    article: { type: String },
    value: { type: Number }, // Declared Value
    manualLrNo: { type: String }, // If migrating old data or manual entry
    remarks: { type: String },

    // Charges
    freight: { type: Number, required: true, default: 0 },
    insurance: { type: Number, default: 0 },
    cartage: { type: Number, default: 0 },
    loading: { type: Number, default: 0 },
    unloading: { type: Number, default: 0 },

    // Taxes & Total
    totalAmount: { type: Number, required: true }, // Sum of charges
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    cgstPercent: { type: Number, default: 0 },
    sgstPercent: { type: Number, default: 0 },
    igstPercent: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },

    // E-Way Bill
    ewayBillNo: { type: String },
    ewayBillDate: { type: Date },

    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customer: { // Link to the registered customer (optional, for direct requests)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
});

// Auto-increment LR No logic could be added here or handled via a counter collection
// For now, we rely on MongoDB _id or implement a separate counter if strictly sequential LR No is needed (User request implies "Manual LR No" field exists, so maybe strict seq is not forced, but typically billing systems need it. We will add a simple sequence later if needed).

const Luggage = mongoose.model('Luggage', luggageSchema);

module.exports = Luggage;
