const jwt = require('jsonwebtoken');
const Employee = require('../../models/Employee');
const cloudinary = require('../../config/cloudinary');

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

    let avatarUrl = req.body.avatar || req.body.profileImage;

    if (avatarUrl && avatarUrl.length > 7000000) {
      return res.status(400).json({
        success: false,
        message: 'Image is too large! Please upload a file smaller than 5MB.'
      });
    }

    if (avatarUrl && avatarUrl.startsWith('data:image')) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(avatarUrl, {
          folder: 'office-management/avatars',
        });
        avatarUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary Registration Upload Error:', uploadError);
      }
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
      avatar: avatarUrl
    });

    if (employee) {
      res.status(201).json({
        success: true,
        data: {
          _id: employee._id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          role: employee.role,
          avatar: employee.avatar,
          passwordChanged: employee.passwordChanged,
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
    // Select everything EXCEPT heavy fields like avatar unless absolutely necessary
    const employee = await Employee.findOne({ email }).select('+password');

    if (employee && (await employee.matchPassword(password))) {
      if (employee.status === 'Terminated') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Access denied.'
        });
      }

      res.json({
        success: true,
        data: {
          _id: employee._id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          role: employee.role,
          avatar: employee.avatar,
          passwordChanged: employee.passwordChanged,
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
