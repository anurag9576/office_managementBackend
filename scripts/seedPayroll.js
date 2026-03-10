const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedPayroll = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env file');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    const targetEmployee = await Employee.findOne({ email: 'anurag@hamsa.com' });
    if (!targetEmployee) {
      console.log('Employee anurag@hamsa.com not found. Please create the employee first.');
      process.exit();
    }
    console.log(`Adding payroll for: ${targetEmployee.firstName} ${targetEmployee.lastName} (${targetEmployee.email})`);

    const dummyPayrolls = [
      {
        employee: targetEmployee._id,
        month: 'February 2026',
        year: 2026,
        paymentDate: new Date('2026-02-28'),
        grossAmount: 105000,
        totalDeductions: 20500,
        netAmount: 84500,
        period: 'February 1 - February 28, 2026',
        status: 'Paid',
        earnings: [
          { label: 'Basic Salary', amount: 45000 },
          { label: 'HRA', amount: 22500 },
          { label: 'Allowances', amount: 17000 },
          { label: 'Performance Bonus', amount: 20500 }
        ],
        deductionsList: [
          { label: 'Professional Tax', amount: 200 },
          { label: 'Income Tax (TDS)', amount: 15300 },
          { label: 'Provident Fund', amount: 5000 }
        ]
      },
      {
        employee: targetEmployee._id,
        month: 'January 2026',
        year: 2026,
        paymentDate: new Date('2026-01-31'),
        grossAmount: 100000,
        totalDeductions: 18000,
        netAmount: 82000,
        period: 'January 1 - January 31, 2026',
        status: 'Paid',
        earnings: [
          { label: 'Basic Salary', amount: 45000 },
          { label: 'HRA', amount: 22500 },
          { label: 'Allowances', amount: 32500 }
        ],
        deductionsList: [
          { label: 'Professional Tax', amount: 200 },
          { label: 'Income Tax (TDS)', amount: 12800 },
          { label: 'Provident Fund', amount: 5000 }
        ]
      }
    ];

    await Payroll.deleteMany({ employee: targetEmployee._id }); // Clear existing for this user
    await Payroll.insertMany(dummyPayrolls);

    console.log('✅ Dummy payroll data added successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding payroll:', error);
    process.exit(1);
  }
};

seedPayroll();
