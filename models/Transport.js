const mongoose = require('mongoose');

const transportSchema = new mongoose.Schema({
    val:Number,
    date: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Transport', transportSchema);
