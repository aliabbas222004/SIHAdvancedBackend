const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billId:String,
  billAddress: String,
  shippingAddress: String,
  customerName: String,
  customerPhone: String,
  customerState: String,
  customerGST: String,
  shipCustName: String,
  shipCustPhone:String,
  shipCustState:String,
  shipCustGST:String,
  items: [
    {
      itemId: String,
      initialPrice: Number,
      finalPrice:Number,
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
