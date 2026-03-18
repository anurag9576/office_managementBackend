const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const Role = require('../models/Role');

// Protect routes
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await Employee.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

// Authorize roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || (!roles.some(role => role.toLowerCase() === req.user.role?.toLowerCase()) && req.user.role?.toLowerCase() !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user?.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

// Check for specific permission
const checkPermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Admins always have access
    if (req.user.role?.toLowerCase() === 'admin') {
      return next();
    }

    try {
      const roleData = await Role.findOne({ 
        name: { $regex: new RegExp(`^${req.user.role}$`, 'i') } 
      });

      if (roleData && roleData.permissions.includes(permission)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} does not have the required permission: ${permission}`,
      });
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ success: false, message: 'Server error during permission check' });
    }
  };
};

module.exports = { protect, authorize, checkPermission };
