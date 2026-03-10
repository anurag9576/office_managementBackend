const Employee = require('../../models/Employee');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private/Admin
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({}).populate('department', 'name');
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
    const employee = await Employee.findById(req.params.id).populate('department', 'name');
    if (employee) {
      res.json({ success: true, data: employee });
    } else {
      res.status(404).json({ success: false, message: 'Employee not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private
const updateEmployee = async (req, res) => {
  try {
    // Check if user is Admin OR if they are updating their OWN profile
    const isSelfUpdate = req.user._id.toString() === req.params.id;
    const isAdmin = req.user.role === 'Admin';

    if (!isAdmin && !isSelfUpdate) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to update this profile' 
      });
    }

    let updateData = { ...req.body };

    // If it's NOT an Admin, then strip sensitive fields to prevent privilege escalation
    if (!isAdmin) {
      delete updateData.role;
      delete updateData.salary; // (if added in the future)
      delete updateData.employeeId;
      delete updateData.status;
      delete updateData.department;
      delete updateData.password; // Should have a separate change-password route
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    
    if (updatedEmployee) {
      res.json({ success: true, data: updatedEmployee });
    } else {
      res.status(404).json({ success: false, message: 'Employee not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private/Admin
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (employee) {
      await employee.deleteOne();
      res.json({ success: true, message: 'Employee removed' });
    } else {
      res.status(404).json({ success: false, message: 'Employee not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getEmployees, getEmployeeById, updateEmployee, deleteEmployee };
