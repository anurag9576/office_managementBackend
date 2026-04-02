const Employee = require('../../models/Employee');
const Leave = require('../../models/Leave');
const NotificationService = require('../common/NotificationService');

class LeaveService {
  async applyLeave(userId, data) {
    const { type, startDate, endDate, days, reason } = data;
    const employee = await Employee.findById(userId);
    
    if (employee.leaveBalance.casual < 2) {
      employee.leaveBalance.casual = 12;
      employee.leaveBalance.sick = 6;
      await employee.save();
    }

    const leaveTypeKey = type === 'Sick Leave' ? 'sick' : 'casual';
    if (type !== 'Optional Leave' && employee.leaveBalance[leaveTypeKey] < days) {
      throw new Error(`Insufficient ${type} balance. Available: ${employee.leaveBalance[leaveTypeKey]}`);
    }

    const leave = await Leave.create({
      employee: userId,
      type,
      startDate,
      endDate,
      days,
      reason
    });

    const admins = await Employee.find({ role: 'Admin' });
    admins.forEach(admin => {
        NotificationService.createNotification({
            recipient: admin._id,
            title: 'New Leave Request',
            message: `${employee.firstName} ${employee.lastName} has applied for ${days} days of ${type}.`,
            type: 'request',
            icon: 'event_busy',
            route: '/dashboard/leaves-admin'
        });
    });

    return leave;
  }

  async getMyLeaves(userId) {
    const leaves = await Leave.find({ employee: userId }).sort('-startDate');
    let employee = await Employee.findById(userId).select('leaveBalance');

    if (!employee.leaveBalance || !employee.leaveBalance.casual) {
      employee.leaveBalance = { casual: 12, sick: 6 };
      await employee.save();
    }

    const approvedLeaves = leaves.filter(l => l.status.toLowerCase() === 'approved');
    const taken = approvedLeaves.reduce((acc, curr) => acc + curr.days, 0);
    const pendingCount = leaves.filter(l => l.status.toLowerCase() === 'pending').length;

    const stats = {
      total: 18,
      casual: employee.leaveBalance.casual,
      sick: employee.leaveBalance.sick,
      taken: taken,
      available: employee.leaveBalance.casual + employee.leaveBalance.sick,
      pending: pendingCount
    };

    return { leaves, stats };
  }

  async updateLeaveStatus(id, status) {
    const leave = await Leave.findById(id);
    if (!leave) throw new Error('Leave not found');

    let employee = await Employee.findById(leave.employee);
    if (!employee.leaveBalance || !employee.leaveBalance.casual) {
      employee.leaveBalance = { casual: 12, sick: 6 };
    }

    const leaveTypeKey = leave.type === 'Sick Leave' ? 'sick' : 'casual';
    const newStatus = status.toLowerCase();
    const oldStatus = leave.status.toLowerCase();

    if (newStatus === 'approved' && oldStatus !== 'approved') {
      if (leave.type !== 'Optional Leave') {
        if (employee.leaveBalance[leaveTypeKey] < leave.days) {
          throw new Error('Insufficient balance to approve this leave');
        }
        employee.leaveBalance[leaveTypeKey] -= leave.days;
      }
    }

    if (oldStatus === 'approved' && newStatus !== 'approved') {
      if (leave.type !== 'Optional Leave') {
        employee.leaveBalance[leaveTypeKey] += leave.days;
      }
    }

    await employee.save();
    leave.status = status;
    await leave.save();

    const isApproved = newStatus === 'approved';
    await NotificationService.createNotification({
        recipient: leave.employee,
        title: isApproved ? 'Leave Approved' : 'Leave Update',
        message: `Your leave request for ${leave.type} has been ${status}.`,
        type: isApproved ? 'success' : 'alert',
        icon: isApproved ? 'check_circle' : 'cancel',
        route: '/dashboard/leaves'
    });

    return leave;
  }

  async getAllLeaves() {
    return await Leave.find().populate('employee', 'firstName lastName employeeId').sort('-startDate');
  }
}

module.exports = new LeaveService();
