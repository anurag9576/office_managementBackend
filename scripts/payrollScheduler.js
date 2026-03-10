const cron = require('node-cron');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');

/**
 * Automatically generates payroll for all employees using their saved structure
 */
const runAutoPayroll = async () => {
  try {
    console.log('--- STARTING AUTO PAYROLL GENERATION ---');
    const employees = await Employee.find({ 'salaryStructure.isAutoGenerate': true });

    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = months[now.getMonth()];
    const currentYear = now.getFullYear();

    for (const emp of employees) {
      // Check if payroll already exists for this month/year for safety
      const existing = await Payroll.findOne({ 
        employee: emp._id, 
        month: currentMonth, 
        year: currentYear 
      });

      if (existing) {
        console.log(`Skipping ${emp.firstName} - Payroll already exists for ${currentMonth} ${currentYear}`);
        continue;
      }

      if (!emp.salaryStructure || !emp.salaryStructure.netAmount) {
        console.log(`Skipping ${emp.firstName} - No salary structure set.`);
        continue;
      }

      const struct = emp.salaryStructure;
      const lastDayDate = new Date(currentYear, now.getMonth() + 1, 0);
      const lastDay = lastDayDate.getDate();
      const periodString = `${currentMonth} 01 - ${currentMonth} ${lastDay}, ${currentYear}`;

      await Payroll.create({
        employee: emp._id,
        month: currentMonth,
        year: currentYear,
        paymentDate: lastDayDate,
        netAmount: struct.netAmount,
        grossAmount: struct.grossAmount,
        totalDeductions: struct.totalDeductions,
        period: periodString,
        designation: emp.designation,
        departmentName: '', // Optional
        daysPresent: 30, // Default for auto
        daysAbsent: 0,
        totalDays: 30,
        earnings: struct.earnings || [],
        deductionsList: struct.deductionsList || [],
        status: 'Paid'
      });
      console.log(`Successfully generated payroll for ${emp.firstName} ${emp.lastName}`);
    }
    console.log('--- AUTO PAYROLL GENERATION COMPLETE ---');
  } catch (error) {
    console.error('Error during auto payroll:', error);
  }
};

// CRON SCHEDULE: Runs every day at 5:00 PM (17:00)
// Inside it checks if it's the last day of the month
cron.schedule('0 17 * * *', async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // If tomorrow is the 1st, then today is the last day of the month
    if (tomorrow.getDate() === 1) {
        console.log('Today is the last day of the month (5:00 PM). Triggering auto-payroll...');
        await runAutoPayroll();
    }
});

// Also provide a way to export the function for manual triggering if needed
module.exports = { runAutoPayroll };
