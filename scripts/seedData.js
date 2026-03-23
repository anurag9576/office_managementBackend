const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('../models/Employee');
const Department = require('../models/Department');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding to office-management...');

    // Clear existing data
    await Employee.deleteMany();
    await Department.deleteMany();

    // 1. Create Department
    const itDept = await Department.create({
      name: 'IT Department',
      description: 'Infrastructure and support'
    });

    console.log('Department created.');

    // 2. Create Admin
    await Employee.create({
      firstName: 'Admin',
      lastName: 'User', 
      email: 'admin@hamsa.com',
      password: 'Test@123',
      employeeId: 'ADM001',
      role: 'Admin',
      designation: 'Administrator',
      department: itDept._id,
      status: 'Active',
      passwordChanged: true,
    });

    console.log('Seed data added successfully!');
    console.log('Admin: admin@hamsa.com / Test@123');

    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
