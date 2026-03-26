const Leave = require('../../models/Leave');
const Employee = require('../../models/Employee');
const { createNotification } = require('../common/notificationController');

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private
const applyLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, days, reason } = req.body;

    // Check balance before applying (optional, but good practice)
    const employee = await Employee.findById(req.user._id);
    
    // DEV-ONLY: Auto Reset balance if it's too low for testing
    if (employee.leaveBalance.casual < 2) {
      employee.leaveBalance.casual = 12;
      employee.leaveBalance.sick = 6;
      await employee.save();
    }

    const leaveTypeKey = type === 'Sick Leave' ? 'sick' : 'casual';
    
    if (type !== 'Optional Leave' && employee.leaveBalance[leaveTypeKey] < days) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient ${type} balance. Available: ${employee.leaveBalance[leaveTypeKey]}` 
      });
    }

    const leave = await Leave.create({
      employee: req.user._id,
      type,
      startDate,
      endDate,
      days,
      reason
    });

    // Notify Admins
    // Notify Admins in parallel
    const admins = await Employee.find({ role: 'Admin' });
    const notificationPromises = admins.map(admin => createNotification({
      recipient: admin._id,
      title: 'New Leave Request',
      message: `${employee.firstName} ${employee.lastName} has applied for ${days} days of ${type}.`,
      type: 'request',
      icon: 'event_busy',
      route: '/dashboard/leaves-admin'
    }));
    await Promise.all(notificationPromises);

    res.status(201).json({ success: true, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get my leaves
// @route   GET /api/leaves/my-leaves
// @access  Private
const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id }).sort('-startDate');
    
    // Select ONLY leaveBalance for performance
    let employee = await Employee.findById(req.user._id).select('leaveBalance');

    // Initialize balance if missing (for existing users)
    if (!employee.leaveBalance || !employee.leaveBalance.casual) {
      employee.leaveBalance = { casual: 12, sick: 6 };
      await employee.save();
    }

    // Calculate taken leaves (Approved ones) - Case Insensitive
    const approvedLeaves = leaves.filter(l => l.status.toLowerCase() === 'approved');
    const taken = approvedLeaves.reduce((acc, curr) => acc + curr.days, 0);
    
    // Calculate pending leaves - Case Insensitive
    const pendingCount = leaves.filter(l => l.status.toLowerCase() === 'pending').length;

    const stats = {
      total: 18,
      casual: employee.leaveBalance.casual,
      sick: employee.leaveBalance.sick,
      taken: taken,
      available: employee.leaveBalance.casual + employee.leaveBalance.sick,
      pending: pendingCount
    };

    res.json({ success: true, data: leaves, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update leave status (Admin/Approver)
// @route   PUT /api/leaves/:id
// @access  Private/Admin
const updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    let employee = await Employee.findById(leave.employee);
    
    // Initialize balance if missing
    if (!employee.leaveBalance || !employee.leaveBalance.casual) {
      employee.leaveBalance = { casual: 12, sick: 6 };
    }

    const leaveTypeKey = leave.type === 'Sick Leave' ? 'sick' : 'casual';

    const newStatus = status.toLowerCase();
    const oldStatus = leave.status.toLowerCase();

    // 1. If leave is being newly APPROVED: Deduct from balance
    if (newStatus === 'approved' && oldStatus !== 'approved') {
      if (leave.type !== 'Optional Leave') {
        if (employee.leaveBalance[leaveTypeKey] < leave.days) {
          return res.status(400).json({ success: false, message: 'Insufficient balance to approve this leave' });
        }
        employee.leaveBalance[leaveTypeKey] -= leave.days;
      }
    }

    // 2. If an ALREADY APPROVED leave is changed to REJECTED or PENDING: Restore the balance
    if (oldStatus === 'approved' && newStatus !== 'approved') {
      if (leave.type !== 'Optional Leave') {
        employee.leaveBalance[leaveTypeKey] += leave.days;
      }
    }

    await employee.save();
    leave.status = status;
    await leave.save();

    // Notify Employee
    const isApproved = newStatus === 'approved';
    await createNotification({
        recipient: leave.employee,
        title: isApproved ? 'Leave Approved' : 'Leave Update',
        message: `Your leave request for ${leave.type} has been ${status}.`,
        type: isApproved ? 'success' : 'alert',
        icon: isApproved ? 'check_circle' : 'cancel',
        route: '/dashboard/leaves'
    });

    res.json({ success: true, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all leaves (Admin)
// @route   GET /api/leaves
// @access  Private/Admin
const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find().populate('employee', 'firstName lastName employeeId').sort('-startDate');
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  updateLeaveStatus,
  getAllLeaves
};
