const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ['Mandatory', 'Optional'], default: 'Mandatory' },
    day: { type: Number },
    month: { type: Number },
    year: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Holiday', holidaySchema);
