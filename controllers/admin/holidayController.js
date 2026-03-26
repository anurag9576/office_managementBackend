const Holiday = require('../../models/Holiday');

// @desc    Get all holidays
// @route   GET /api/holidays
exports.getHolidays = async (req, res) => {
    try {
        const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
        const holidays = await Holiday.find({ year }).sort({ date: 1 });
        res.status(200).json({ success: true, count: holidays.length, data: holidays });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Add holiday
// @route   POST /api/holidays
exports.addHoliday = async (req, res) => {
    try {
        const holiday = await Holiday.create(req.body);
        res.status(201).json({ success: true, data: holiday });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete holiday
// @route   DELETE /api/holidays/:id
exports.deleteHoliday = async (req, res) => {
    try {
        const holiday = await Holiday.findByIdAndDelete(req.params.id);
        if (!holiday) {
            return res.status(404).json({ success: false, message: 'Holiday not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
