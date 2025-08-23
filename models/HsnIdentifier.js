const mongoose = require('mongoose');

const hsnIdentifierSchema = new mongoose.Schema({
    company:{
        type:String,
    },
    itemType:String,
    hsn:String
});

module.exports = mongoose.model('HsnIdentifierSchema', hsnIdentifierSchema);
