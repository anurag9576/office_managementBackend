const Timesheet = require('../../models/Timesheet');

class TimesheetService {
  async createTimesheet(userId, data) {
    return await Timesheet.create({
        employeeId: userId,
        ...data
    });
  }

  async getMyTimesheets(userId) {
    return await Timesheet.find({ employeeId: userId }).sort({ date: -1 });
  }

  async updateTimesheet(id, userId, data, role) {
    let timesheet = await Timesheet.findById(id);
    if (!timesheet) throw new Error('Timesheet not found');
    if (timesheet.employeeId.toString() !== userId && role !== 'admin') {
        throw new Error('Not authorized');
    }
    return await Timesheet.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async deleteTimesheet(id, userId, role) {
    const timesheet = await Timesheet.findById(id);
    if (!timesheet) throw new Error('Timesheet not found');
    if (timesheet.employeeId.toString() !== userId && role !== 'admin') {
        throw new Error('Not authorized');
    }
    await timesheet.deleteOne();
    return true;
  }

  async getAllTimesheets() {
    return await Timesheet.find().populate('employeeId', 'firstName lastName email role').sort({ date: -1 });
  }
}

module.exports = new TimesheetService();
