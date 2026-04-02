const Employee = require('../../models/Employee');
const cloudinary = require('../../config/cloudinary');
const { deleteFromCloudinary } = require('../../utils/cloudinaryHelper');
const bcrypt = require('bcryptjs');

class EmployeeProfileService {
  async getEmployees() {
    return await Employee.find({})
      .select('firstName lastName email role designation status employeeId joiningDate avatar')
      .populate('department', 'name')
      .lean();
  }

  async getEmployeeById(id) {
    const employee = await Employee.findById(id)
      .populate('department', 'name')
      .lean();
    if (!employee) throw new Error('Employee not found');
    return employee;
  }

  async getNextEmployeeId() {
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
    return `HHPL ${formattedNumber}`;
  }

  async updateEmployee(id, updateData, currentUser) {
    const isSelfUpdate = currentUser._id.toString() === id;
    const isAdmin = currentUser.role?.toLowerCase() === 'admin';

    if (!isAdmin && !isSelfUpdate) {
      throw new Error('You are not authorized to update this profile');
    }

    const employee = await Employee.findById(id);
    if (!employee) throw new Error('Employee not found');

    let dataToUpdate = { ...updateData };

    if (dataToUpdate.profileImage && !dataToUpdate.avatar) {
      dataToUpdate.avatar = dataToUpdate.profileImage;
    }

    if (dataToUpdate.avatar && dataToUpdate.avatar !== employee.avatar) {
      if (dataToUpdate.avatar.startsWith('data:image')) {
        const uploadResponse = await cloudinary.uploader.upload(dataToUpdate.avatar, {
          folder: 'office-management/avatars',
          transformation: [
            { width: 500, height: 500, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        });
        
        if (employee.avatar) {
          await deleteFromCloudinary(employee.avatar);
        }
        dataToUpdate.avatar = uploadResponse.secure_url;
      }
      delete dataToUpdate.profileImage;
    }

    if (!isAdmin) {
      delete dataToUpdate.role;
      delete dataToUpdate.salary;
      delete dataToUpdate.employeeId;
      delete dataToUpdate.status;
      delete dataToUpdate.department;
      delete dataToUpdate.password;
    }

    if (dataToUpdate.password) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, salt);
    } else {
      delete dataToUpdate.password;
    }

    if (dataToUpdate.status === 'Terminated' && employee.status !== 'Terminated') {
      dataToUpdate.terminationDate = new Date();
    } else if (dataToUpdate.status === 'Active' && employee.status === 'Terminated') {
      dataToUpdate.terminationDate = null;
    }

    delete dataToUpdate._id;
    delete dataToUpdate.__v;

    return await Employee.findByIdAndUpdate(
      id,
      { $set: dataToUpdate },
      { new: true, runValidators: true }
    );
  }
}

module.exports = new EmployeeProfileService();
