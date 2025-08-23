const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, 
  totalCostPrice: { type: Number,default:0}, 
  totalSellingPrice: { type: Number,default:0},
  totalQuantity: { type: Number,default:0},
});

module.exports = mongoose.model('Inventory', inventorySchema);
