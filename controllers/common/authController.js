const AuthService = require('../../services/common/AuthService');
const Employee = require('../../models/Employee');

// @desc    Register a new employee/admin
// @route   POST /api/auth/register
// @access  Private/Admin
const registerEmployee = async (req, res) => {
  try {
    const data = await AuthService.register(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    const statusCode = error.message.includes('exists') ? 400 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await AuthService.login(email, password);
    res.json({ success: true, data });
  } catch (error) {
    const statusCode = error.message.includes('Invalid') ? 401 : 
                      error.message.includes('deactivated') ? 403 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const employee = await Employee.findById(req.user.id);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    employee.password = newPassword;
    employee.passwordChanged = true;
    await employee.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { registerEmployee, loginEmployee, changePassword };
