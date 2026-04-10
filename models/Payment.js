const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    phoneNo: {
        type: String,
        required: true,
        unique: true,
    },

    // ✅ OLD (keep as is)
    cash: [
        {
            amount: Number,
            date: String,
        },
    ],
    gpay: [
        {
            amount: Number,
            date: String,
            transactionId: String,
        },
    ],

    // ✅ NEW (payment you gave to customer)
    cashGiven: [
        {
            amount: Number,
            date: String,
        },
    ],
    gpayGiven: [
        {
            amount: Number,
            date: String,
            transactionId: String,
        },
    ],

    // ✅ NEW (customer sold to you)
    billsReceived: [
        {
            amount: Number,
            date: String,
            billId: String,
        },
    ],
});

module.exports = mongoose.model('Payment', paymentSchema);