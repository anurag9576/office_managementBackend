const Role = require('../../models/Role');

class RoleService {
  async getRoles() {
    let roles = await Role.find();
    
    // If no roles exist, seed default roles
    if (roles.length === 0) {
      const defaultRoles = [
        { 
          name: 'Admin', 
          permissions: ['dashboard', 'employees', 'roles', 'leaves-admin', 'payroll-admin', 'tasks', 'reports', 'announcement', 'settings'],
          isSystemRole: true 
        },
        { 
          name: 'Employee', 
          permissions: ['dashboard', 'profile', 'leaves', 'payroll', 'announcement', 'help'],
          isSystemRole: true 
        },
        { 
          name: 'HR Manager', 
          permissions: ['dashboard', 'employees', 'leaves-admin', 'announcement'],
          isSystemRole: false 
        },
        { 
          name: 'QA', 
          permissions: ['dashboard', 'profile', 'announcement', 'help'],
          isSystemRole: false 
        },
        { 
          name: 'Developer', 
          permissions: ['dashboard', 'profile', 'announcement', 'help', 'tasks'],
          isSystemRole: false 
        },
        { 
          name: 'Manager', 
          permissions: ['dashboard', 'leaves-admin', 'announcement', 'tasks', 'profile', 'help'],
          isSystemRole: false 
        },
        { 
          name: 'IT Team', 
          permissions: ['dashboard', 'settings', 'announcement', 'help'],
          isSystemRole: false 
        }
      ];
      roles = await Role.insertMany(defaultRoles);
    }
    return roles;
  }

  async upsertRole(data) {
    const { id, name, permissions, description } = data;
    let role;
    if (id) {
      role = await Role.findById(id);
    } else {
      role = await Role.findOne({ name });
    }

    if (role) {
      role.name = name || role.name;
      role.permissions = permissions;
      role.description = description || role.description;
      await role.save();
    } else {
      role = await Role.create({ name, permissions, description });
    }
    return role;
  }

  async deleteRole(id) {
    const role = await Role.findById(id);
    if (!role) throw new Error('Role not found');

    const protectedRoles = ['Admin', 'Employee'];
    if (protectedRoles.includes(role.name)) {
      throw new Error('System roles (Admin/Employee) cannot be deleted');
    }

    await role.deleteOne();
    return true;
  }
}

module.exports = new RoleService();
