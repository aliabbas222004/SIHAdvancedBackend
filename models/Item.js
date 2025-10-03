const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true },
  HSN:{type:String,required:true},
  itemName: { type: String, required: true },
  type:String,
  company:String
});

module.exports = mongoose.model('Item', itemSchema);
