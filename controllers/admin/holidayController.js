const HolidayService = require('../../services/admin/HolidayService');

exports.getHolidays = async (req, res) => {
    try {
        const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
        const holidays = await HolidayService.getHolidays(year);
        res.status(200).json({ success: true, count: holidays.length, data: holidays });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.addHoliday = async (req, res) => {
    try {
        const holiday = await HolidayService.addHoliday(req.body);
        res.status(201).json({ success: true, data: holiday });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deleteHoliday = async (req, res) => {
    try {
        await HolidayService.deleteHoliday(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        const statusCode = err.message === 'Holiday not found' ? 404 : 400;
        res.status(statusCode).json({ success: false, message: err.message });
    }
};
