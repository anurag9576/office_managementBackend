const Employee = require('../../models/Employee');
const cloudinary = require('../../config/cloudinary');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private/Admin
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({})
      .select('firstName lastName email role designation status employeeId joiningDate avatar')
      .populate('department', 'name')
      .lean();
    
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
    const employee = await Employee.findById(req.params.id)
      .populate('department', 'name')
      .lean();
      
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
    const isSelfUpdate = req.user._id.toString() === req.params.id;
    const isAdmin = req.user.role?.toLowerCase() === 'admin';

    if (!isAdmin && !isSelfUpdate) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to update this profile' 
      });
    }

    console.log('Update Request Body Keys:', Object.keys(req.body));
    let updateData = { ...req.body };

    // Handle profileImage as an alias for avatar if needed
    if (updateData.profileImage && !updateData.avatar) {
      updateData.avatar = updateData.profileImage;
    }

    if (updateData.avatar && updateData.avatar.length > 7000000) { // Approx 5MB binary
      return res.status(400).json({
        success: false,
        message: 'Image is too large! Please upload a file smaller than 5MB.'
      });
    }

    if (updateData.avatar && updateData.avatar.startsWith('data:image')) {
      try {
        console.log('Uploading image to Cloudinary...');
        const uploadResponse = await cloudinary.uploader.upload(updateData.avatar, {
          folder: 'office-management/avatars',
          // Optimize image on upload
          transformation: [
            { width: 500, height: 500, crop: 'limit' }, // Resize if larger than 500x500
            { quality: 'auto' }, // Automatic compression
            { fetch_format: 'auto' } // Automatic format (webp/avif)
          ]
        });
        console.log('Cloudinary Upload Success:', uploadResponse.secure_url);
        updateData.avatar = uploadResponse.secure_url;
        // Ensure we remove profileImage from updateData if it was there to avoid confusion
        delete updateData.profileImage;
      } catch (uploadError) {
        console.error('Cloudinary Upload Error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Image upload failed',
          error: uploadError.message
        });
      }
    }

    if (!isAdmin) {
      delete updateData.role;
      delete updateData.salary; // (if added in the future)
      delete updateData.employeeId;
      delete updateData.status;
      delete updateData.department;
      delete updateData.password; // Should have a separate change-password route
    }

    const employee = await Employee.findById(req.params.id).select('-avatar');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (updateData.password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.getSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    } else {
      delete updateData.password;
    }

    delete updateData._id;
    delete updateData.__v;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    res.json({ success: true, data: updatedEmployee });
  } catch (error) {
    console.error('Update Employee Error Details:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to update employee profile'
    });
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

// @desc    Get next employee ID
// @route   GET /api/employees/next-id
// @access  Private/Admin
const getNextEmployeeId = async (req, res) => {
  try {
    const lastEmployee = await Employee.findOne(
      { employeeId: /^HHPL \d+/ },
      { employeeId: 1 },
      { sort: { employeeId: -1 } }
    );

    let nextIdNumber = 1;
    if (lastEmployee && lastEmployee.employeeId) {
      const lastIdStr = lastEmployee.employeeId.replace('HHPL ', '');
      const lastIdNum = parseInt(lastIdStr, 10);
      if (!isNaN(lastIdNum)) {
        nextIdNumber = lastIdNum + 1;
      }
    }
    const formattedNumber = nextIdNumber < 10 ? `0${nextIdNumber}` : nextIdNumber;
    const nextId = `HHPL ${formattedNumber}`;
    
    res.json({ success: true, nextId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getEmployees, getEmployeeById, updateEmployee, deleteEmployee, getNextEmployeeId };
