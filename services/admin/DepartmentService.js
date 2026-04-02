const Department = require('../../models/Department');

class DepartmentService {
  async getDepartments() {
    let departments = await Department.find({}).populate('head', 'firstName lastName email');
    
    // Auto-seed if empty
    if (departments.length === 0) {
      const defaultDeps = [
        { name: 'IT Department', description: 'Tech related stuff' },
        { name: 'HR Department', description: 'Human resources' },
        { name: 'Finance', description: 'Money management' },
        { name: 'Design', description: 'Visual design and UI' }
      ];
      await Department.create(defaultDeps);
      departments = await Department.find({}).populate('head', 'firstName lastName email');
    }
    return departments;
  }

  async createDepartment(data) {
    const { name, description, head } = data;
    const departmentExists = await Department.findOne({ name });
    if (departmentExists) {
      throw new Error('Department already exists');
    }
    return await Department.create({ name, description, head });
  }

  async updateDepartment(id, data) {
    const department = await Department.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!department) throw new Error('Department not found');
    return department;
  }

  async deleteDepartment(id) {
    const department = await Department.findById(id);
    if (!department) throw new Error('Department not found');
    await department.deleteOne();
    return true;
  }
}

module.exports = new DepartmentService();
