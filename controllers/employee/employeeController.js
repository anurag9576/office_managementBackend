const EmployeeProfileService = require('../../services/employee/EmployeeProfileService');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private/Admin
const getEmployees = async (req, res) => {
  try {
    const employees = await EmployeeProfileService.getEmployees(req.user);
    res.json({ success: true, count: employees.length, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
const getEmployeeById = async (req, res) => {
  try {
    const employee = await EmployeeProfileService.getEmployeeById(req.params.id);
    res.json({ success: true, data: employee });
  } catch (error) {
    const statusCode = error.message === 'Employee not found' ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private
const updateEmployee = async (req, res) => {
  try {
    const updatedEmployee = await EmployeeProfileService.updateEmployee(
      req.params.id, 
      req.body, 
      req.user
    );
    res.json({ success: true, data: updatedEmployee });
  } catch (error) {
    console.error('Update Employee Error:', error);
    const statusCode = error.message.includes('authorized') ? 403 : 
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to update employee profile'
    });
  }
};

// @desc    Get next employee ID
// @route   GET /api/employees/next-id
// @access  Private/Admin
const getNextEmployeeId = async (req, res) => {
  try {
    const nextId = await EmployeeProfileService.getNextEmployeeId();
    res.json({ success: true, nextId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getEmployees, getEmployeeById, updateEmployee, getNextEmployeeId };
