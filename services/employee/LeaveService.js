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
      reason,
      manager: employee.reportingManager
    });

    // 1. Notify Assigned Manager (Reporting Manager)
    if (employee.reportingManager) {
      console.log(`Notifying assigned manager: ${employee.reportingManager}`);
      await NotificationService.createNotification({
        recipient: employee.reportingManager,
        title: 'New Leave Request',
        message: `${employee.firstName} ${employee.lastName} has applied for ${days} days of ${type}.`,
        type: 'request',
        icon: 'event_busy',
        route: '/dashboard/leaves-admin'
      });
    } else {
      console.log('No reporting manager assigned for this employee');
    }

    // 2. Notify Admins
    const admins = await Employee.find({ role: 'Admin' }).select('_id');
    for (const admin of admins) {
      if (admin._id.toString() !== userId.toString() && 
          admin._id.toString() !== employee.reportingManager?.toString()) {
        console.log(`Notifying Admin: ${admin._id}`);
        await NotificationService.createNotification({
          recipient: admin._id,
          title: 'New Leave Request (Admin)',
          message: `${employee.firstName} ${employee.lastName} has applied for ${days} days of ${type}.`,
          type: 'request',
          icon: 'admin_panel_settings',
          route: '/dashboard/leaves-admin'
        });
      }
    }

    // 3. Notify HR
    const hrUsers = await Employee.find({ role: 'HR' }).select('_id');
    for (const hr of hrUsers) {
      if (hr._id.toString() !== userId.toString() && 
          hr._id.toString() !== employee.reportingManager?.toString()) {
        console.log(`Notifying HR: ${hr._id}`);
        await NotificationService.createNotification({
          recipient: hr._id,
          title: 'Leave Application Filed',
          message: `${employee.firstName} ${employee.lastName} applied for ${type}.`,
          type: 'request',
          icon: 'summarize',
          route: '/dashboard/leaves-summary'
        });
      }
    }

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

  async updateLeaveStatus(id, status, currentUser) {
    const leave = await Leave.findById(id);
    if (!leave) throw new Error('Leave not found');

    const isAdmin = currentUser.role?.toLowerCase() === 'admin';
    const isAssignedManager = leave.manager?.toString() === currentUser._id.toString();

    if (!isAdmin && !isAssignedManager) {
      throw new Error('You are not authorized to update this leave request');
    }

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
    leave.approvedBy = currentUser._id;
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

  async getAllLeaves(user) {
    let query = {};
    if (user.role !== 'Admin') {
      // Find all employees reporting to this manager
      const subordinates = await Employee.find({ reportingManager: user._id }).select('_id');
      const subordinateIds = subordinates.map(s => s._id);
      
      query.employee = { $in: subordinateIds };
    }
    return await Leave.find(query)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId reportingManager',
        populate: {
          path: 'reportingManager',
          select: 'firstName lastName'
        }
      })
      .populate('manager', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort('-createdAt');
  }

  async getLeaveSummary(user) {
    const isHR = user.role?.toLowerCase() === 'hr';
    const isAdmin = user.role?.toLowerCase() === 'admin';
    
    if (!isHR && !isAdmin) {
      throw new Error('Not authorized to view leave summary');
    }

    const leaves = await Leave.find()
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId leaveBalance reportingManager',
        populate: { path: 'reportingManager', select: 'firstName lastName' }
      })
      .populate('approvedBy', 'firstName lastName')
      .populate('manager', 'firstName lastName')
      .sort({ createdAt: -1 });

    const summary = leaves.map(leave => {
      const emp = leave.employee;
      
      // Robust Logic to match Management Tab: 
      // 1. Action Processor (approvedBy)
      // 2. Assigned Manager (manager)
      // 3. Current Reporting Manager (emp.reportingManager)
      let displayApprover = 'Pending';
      const status = (leave.status || '').toLowerCase();
      
      if (status !== 'pending' && status !== '') {
        const approver = leave.approvedBy || leave.manager || emp?.reportingManager;
        displayApprover = approver ? `${approver.firstName} ${approver.lastName}` : 'Admin';
      }

      return {
        _id: leave._id,
        firstName: emp?.firstName || 'N/A',
        lastName: emp?.lastName || '',
        employeeId: emp?.employeeId || 'N/A',
        type: leave.type,
        days: leave.days,
        status: leave.status,
        reason: leave.reason,
        startDate: leave.startDate,
        approvedBy: displayApprover,
        createdAt: leave.createdAt
      };
    });

    return summary;
  }
}

module.exports = new LeaveService();
