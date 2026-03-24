const cron = require('node-cron');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Leave = require('../models/Leave');

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
      const startOfMonth = new Date(currentYear, now.getMonth(), 1);
      const lastDayDate = new Date(currentYear, now.getMonth() + 1, 0);
      const endOfMonth = new Date(currentYear, now.getMonth() + 1, 0, 23, 59, 59);
      const totalDaysInMonth = lastDayDate.getDate();
      const periodString = `${currentMonth} 01 - ${currentMonth} ${totalDaysInMonth}, ${currentYear}`;

      // Calculate Leaves/Absent Days
      const approvedLeaves = await Leave.find({
        employee: emp._id,
        status: 'Approved',
        $or: [
          { startDate: { $gte: startOfMonth, $lte: endOfMonth } },
          { endDate: { $gte: startOfMonth, $lte: endOfMonth } }
        ]
      });

      let daysAbsent = 0;
      approvedLeaves.forEach(lv => {
        // Calculate overlap with current month if leave spans across months
        const start = lv.startDate < startOfMonth ? startOfMonth : lv.startDate;
        const end = lv.endDate > endOfMonth ? endOfMonth : lv.endDate;
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        daysAbsent += diffDays;
      });

      const daysPresent = totalDaysInMonth - daysAbsent;

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
        daysPresent,
        daysAbsent,
        totalDays: totalDaysInMonth,
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

// PRODUCTION SCHEDULE: Runs at 5:00 PM (17:00) on the Last day of Every Month
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
