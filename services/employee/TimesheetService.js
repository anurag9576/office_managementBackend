const Timesheet = require('../../models/Timesheet');
const Employee = require('../../models/Employee');

class TimesheetService {
  async createTimesheet(userId, data) {
    const employee = await Employee.findById(userId);
    return await Timesheet.create({
        employeeId: userId,
        manager: employee?.reportingManager || null,
        ...data
    });
  }

  async getMyTimesheets(userId) {
    return await Timesheet.find({ employeeId: userId }).sort({ date: -1 });
  }

  async updateTimesheet(id, userId, data, role) {
    let timesheet = await Timesheet.findById(id);
    if (!timesheet) throw new Error('Timesheet not found');
    
    const isAdmin = role.toLowerCase() === 'admin';
    const isOwner = timesheet.employeeId.toString() === userId;
    const isManager = timesheet.manager?.toString() === userId;

    if (!isOwner && !isAdmin && !isManager) {
        throw new Error('Not authorized to update this timesheet');
    }
    return await Timesheet.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async deleteTimesheet(id, userId, role) {
    const timesheet = await Timesheet.findById(id);
    if (!timesheet) throw new Error('Timesheet not found');
    
    const isAdmin = role.toLowerCase() === 'admin';
    const isOwner = timesheet.employeeId.toString() === userId;
    const isManager = timesheet.manager?.toString() === userId;

    if (!isOwner && !isAdmin && !isManager) {
        throw new Error('Not authorized to delete this timesheet');
    }
    await timesheet.deleteOne();
    return true;
  }

  async getAllTimesheets(user) {
    let query = {};
    if (user && user.role !== 'Admin') {
      // Find all employees reporting to this manager
      const subordinates = await Employee.find({ reportingManager: user._id }).select('_id');
      const subordinateIds = subordinates.map(s => s._id);
      
      // Also include timesheets directly assigned to this manager (fallback for snapshots)
      // or just filter by subordinateIds if we want current mapping only.
      // Current mapping is better:
      query.employeeId = { $in: subordinateIds };
    }
    return await Timesheet.find(query)
      .populate('employeeId', 'firstName lastName email role')
      .sort({ date: -1 });
  }
}

module.exports = new TimesheetService();
