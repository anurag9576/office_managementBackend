const jwt = require('jsonwebtoken');
const Employee = require('../../models/Employee');

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new employee/admin
// @route   POST /api/auth/register
// @access  Private/Admin
const registerEmployee = async (req, res) => {
  try {
    const { firstName, lastName, email, password, employeeId, role, designation, department } = req.body;

    const employeeExists = await Employee.findOne({ $or: [{ email }, { employeeId }] });
    if (employeeExists) {
      return res.status(400).json({ success: false, message: 'Employee already exists' });
    }

    const employee = await Employee.create({
      firstName,
      lastName,
      email,
      password,
      employeeId,
      role,
      designation,
      department,
    });

    if (employee) {
      res.status(201).json({
        success: true,
        data: {
          _id: employee._id,
          firstName: employee.firstName,
          email: employee.email,
          role: employee.role,
          token: generateToken(employee._id),
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid employee data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;
    const employee = await Employee.findOne({ email }).select('+password');

    if (employee && (await employee.matchPassword(password))) {
      res.json({
        success: true,
        data: {
          _id: employee._id,
          firstName: employee.firstName,
          email: employee.email,
          role: employee.role,
          token: generateToken(employee._id),
        },
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { registerEmployee, loginEmployee };
