const Holiday = require('../../models/Holiday');

class HolidayService {
    async getHolidays(year = new Date().getFullYear()) {
        return await Holiday.find({ year }).sort({ date: 1 });
    }

    async addHoliday(data) {
        return await Holiday.create(data);
    }

    async deleteHoliday(id) {
        const holiday = await Holiday.findByIdAndDelete(id);
        if (!holiday) {
            throw new Error('Holiday not found');
        }
        return true;
    }
}

module.exports = new HolidayService();
