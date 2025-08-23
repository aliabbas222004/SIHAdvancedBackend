const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billId:String,
  billAddress: String,
  shippingAddress: String,
  customerPhone: String,
  customerGST: String,
  items: [
    {
      itemId: String,
      givenPrice: Number,
      quantity: Number,
    }
  ],
  totalAmount: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Bill', billSchema);
