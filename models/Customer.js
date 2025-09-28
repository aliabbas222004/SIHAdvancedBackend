const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name:String,
  address:String,
  phoneNo:String,
  state:String,
  GSTIN:String
});

module.exports = mongoose.model('Customer', customerSchema);
