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
      HSN: String,
      itemName: String,
      initialPrice: Number,
      finalPrice:Number,
      quantity: Number,
      gstValue: Number
    }
  ],
  totalAmount: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  paymentMode: String,
  freightCharge_packaging: Number
});

module.exports = mongoose.model('Bill', billSchema);
