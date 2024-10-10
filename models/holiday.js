const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: String, required: true } // Store date as a string in 'YYYY-MM-DD' format
});

const Holiday = mongoose.model('Holiday', holidaySchema);

module.exports = Holiday;
