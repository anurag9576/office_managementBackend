const DepartmentService = require('../../services/admin/DepartmentService');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
const getDepartments = async (req, res) => {
  try {
    const departments = await DepartmentService.getDepartments();
    res.json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create a department
// @route   POST /api/departments
// @access  Private/Admin
const createDepartment = async (req, res) => {
  try {
    const department = await DepartmentService.createDepartment(req.body);
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    const statusCode = error.message.includes('exists') ? 400 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private/Admin
const updateDepartment = async (req, res) => {
  try {
    const department = await DepartmentService.updateDepartment(req.params.id, req.body);
    res.json({ success: true, data: department });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

// @desc    Delete a department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
const deleteDepartment = async (req, res) => {
  try {
    await DepartmentService.deleteDepartment(req.params.id);
    res.json({ success: true, message: 'Department removed' });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
