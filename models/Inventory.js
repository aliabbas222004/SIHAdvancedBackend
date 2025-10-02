const mongoose = require('mongoose');

// const inventorySchema = new mongoose.Schema({
//   itemId: { type: String, required: true },
//   quantity: { type: Number, required: true },
//   price: { type: Number, required: true }, 
//   totalCostPrice: { type: Number,default:0}, 
//   totalSellingPrice: { type: Number,default:0},
//   totalQuantity: { type: Number,default:0},
// });


const inventorySchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  quantityInStock: { type: Number, required: true },
  priceOfStock:{type:Number,required:true},
  purchases: [
    {
      quantity: { type: Number },
      price: { type: Number },
      date: { type: Date, default: Date.now }
    }
  ],
});

module.exports = mongoose.model('Inventory', inventorySchema);
