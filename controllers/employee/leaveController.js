const LeaveService = require('../../services/employee/LeaveService');

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private
const applyLeave = async (req, res) => {
  try {
    const leave = await LeaveService.applyLeave(req.user._id, req.body);
    res.status(201).json({ success: true, data: leave });
  } catch (error) {
    const statusCode = error.message.includes('balance') ? 400 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

// @desc    Get my leaves
// @route   GET /api/leaves/my-leaves
// @access  Private
const getMyLeaves = async (req, res) => {
  try {
    const data = await LeaveService.getMyLeaves(req.user._id);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update leave status (Admin/Approver)
// @route   PUT /api/leaves/:id
// @access  Private/Admin
const updateLeaveStatus = async (req, res) => {
  try {
    const leave = await LeaveService.updateLeaveStatus(req.params.id, req.body.status, req.user);
    res.json({ success: true, data: leave });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('balance') ? 400 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

// @desc    Get all leaves (Admin)
// @route   GET /api/leaves
// @access  Private/Admin
const getAllLeaves = async (req, res) => {
  try {
    const leaves = await LeaveService.getAllLeaves(req.user);
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get leave summary for HR/Admin
// @route   GET /api/leaves/summary
// @access  Private
const getLeaveSummary = async (req, res) => {
  try {
    const summary = await LeaveService.getLeaveSummary(req.user);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(error.message.includes('authorized') ? 403 : 500).json({ success: false, error: error.message });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  updateLeaveStatus,
  getAllLeaves,
  getLeaveSummary
};
