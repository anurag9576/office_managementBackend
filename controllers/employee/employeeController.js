const Employee = require('../../models/Employee');
const cloudinary = require('../../config/cloudinary');
const { deleteFromCloudinary } = require('../../utils/cloudinaryHelper');

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

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Handle profileImage as an alias for avatar if needed
    if (updateData.profileImage && !updateData.avatar) {
      updateData.avatar = updateData.profileImage;
    }

    if (updateData.avatar && updateData.avatar.length > 7000000) { 
      return res.status(400).json({
        success: false,
        message: 'Image is too large! Please upload a file smaller than 5MB.'
      });
    }

   
    if (updateData.avatar && updateData.avatar !== employee.avatar) {
      let oldAvatarUrl = employee.avatar;
      let isReadyToDelete = false;

      if (updateData.avatar.startsWith('data:image')) {
        try {
          console.log('Uploading image to Cloudinary...');
          const uploadResponse = await cloudinary.uploader.upload(updateData.avatar, {
            folder: 'office-management/avatars',
            transformation: [
              { width: 500, height: 500, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' }
            ]
          });
          console.log('Cloudinary Upload Success:', uploadResponse.secure_url);
          updateData.avatar = uploadResponse.secure_url;
          isReadyToDelete = true;
        } catch (uploadError) {
          console.error('Cloudinary Upload Error:', uploadError);
          isReadyToDelete = false;
          
        }
      } else if (updateData.avatar.includes('cloudinary.com')) {
        isReadyToDelete = true;
      }

      if (isReadyToDelete && oldAvatarUrl) {
        await deleteFromCloudinary(oldAvatarUrl);
      }
      
      delete updateData.profileImage;
    }

    if (!isAdmin) {
      delete updateData.role;
      delete updateData.salary; 
      delete updateData.employeeId;
      delete updateData.status;
      delete updateData.department;
      delete updateData.password; 
    }

    if (updateData.password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.getSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    } else {
      delete updateData.password;
    }

    // Auto-manage terminationDate based on status
    if (updateData.status === 'Terminated' && employee.status !== 'Terminated') {
      updateData.terminationDate = new Date();
    } else if (updateData.status === 'Active' && employee.status === 'Terminated') {
      updateData.terminationDate = null;
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

module.exports = { getEmployees, getEmployeeById, updateEmployee, getNextEmployeeId };
