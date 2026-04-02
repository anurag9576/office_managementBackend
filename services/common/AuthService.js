const jwt = require('jsonwebtoken');
const Employee = require('../../models/Employee');
const cloudinary = require('../../config/cloudinary');

class AuthService {
  generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  }

  async login(email, password) {
    const employee = await Employee.findOne({ email }).select('+password');
    if (!employee || !(await employee.matchPassword(password))) {
      throw new Error('Invalid email or password');
    }

    if (employee.status === 'Terminated') {
      throw new Error('Your account has been deactivated. Access denied.');
    }

    const token = this.generateToken(employee._id);
    return {
      _id: employee._id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      role: employee.role,
      avatar: employee.avatar,
      passwordChanged: employee.passwordChanged,
      token
    };
  }

  async register(data) {
    const { firstName, lastName, email, password, employeeId, role, designation, department } = data;
    const employeeExists = await Employee.findOne({ $or: [{ email }, { employeeId }] });
    if (employeeExists) {
      throw new Error('Employee already exists');
    }

    let avatarUrl = data.avatar || data.profileImage;
    if (avatarUrl && avatarUrl.startsWith('data:image')) {
      const uploadResponse = await cloudinary.uploader.upload(avatarUrl, {
        folder: 'office-management/avatars',
      });
      avatarUrl = uploadResponse.secure_url;
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

    const token = this.generateToken(employee._id);
    return {
      _id: employee._id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      role: employee.role,
      avatar: employee.avatar,
      passwordChanged: employee.passwordChanged,
      token
    };
  }
}

module.exports = new AuthService();
