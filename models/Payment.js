const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    phoneNo: {
        type: String,
        required: true,
        unique: true,
    },
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
});

module.exports = mongoose.model('Payment', paymentSchema);
