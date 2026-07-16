const mongoose = require('mongoose');

const hsnIdentifierSchema = new mongoose.Schema({
    company:{
        type:String,
    },
    itemType:String,
    hsn:String,
    gst:{
        type: Number,
        default: 18 
    }
});

module.exports = mongoose.model('HsnIdentifierSchema', hsnIdentifierSchema);
