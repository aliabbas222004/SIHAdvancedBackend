const mongoose = require('mongoose');

const directBillSchema = new mongoose.Schema({
  customerName: String,
  items: [
    {
      itemName: String,
      purchasePrice: Number,
      sellingPrice:Number,
      quantity: Number,
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('DirectBill', directBillSchema);
