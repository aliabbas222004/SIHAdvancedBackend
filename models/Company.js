const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name:String,
  address:String,
  phoneNo:String
});

module.exports = mongoose.model('Company', companySchema);
