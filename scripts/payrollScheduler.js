const cron = require('node-cron');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Leave = require('../models/Leave');
const SalaryMaster = require('../models/SalaryMaster');

const runAutoPayroll = async (targetDate = new Date()) => {
  try {
    console.log(`--- STARTING AUTO PAYROLL GENERATION FOR ${targetDate.toDateString()} ---`);
    
    const salaryMasters = await SalaryMaster.find({}).populate('employee');

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = months[targetDate.getMonth()];
    const currentYear = targetDate.getFullYear();

    for (const master of salaryMasters) {
      const emp = master.employee;
      if (!emp) continue;

      const existing = await Payroll.findOne({ 
        employee: emp._id, 
        month: currentMonth, 
        year: currentYear 
      });

      if (existing) {
        console.log(`Skipping ${emp.firstName} - Payroll already exists for ${currentMonth} ${currentYear}`);
        continue;
      }

      if (!master.netAmount) {
        console.log(`Skipping ${emp.firstName} - No net amount set in Salary Master.`);
        continue;
      }

      const startOfMonth = new Date(currentYear, targetDate.getMonth(), 1);
      const lastDayDate = new Date(currentYear, targetDate.getMonth() + 1, 0);
      const endOfMonth = new Date(currentYear, targetDate.getMonth() + 1, 0, 23, 59, 59);
      const totalDaysInMonth = lastDayDate.getDate();
      const periodString = `${currentMonth} 01 - ${currentMonth} ${totalDaysInMonth}, ${currentYear}`;

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
        netAmount: master.netAmount,
        grossAmount: master.grossAmount,
        totalDeductions: master.totalDeductions,
        period: periodString,
        designation: master.designation || emp.designation,
        departmentName: master.departmentName || '', 
        daysPresent,
        daysAbsent,
        totalDays: totalDaysInMonth,
        earnings: master.earnings || [],
        deductionsList: master.deductionsList || [],
        status: 'Paid'
      });
      console.log(`Successfully generated payroll for ${emp.firstName} ${emp.lastName}`);
    }
    console.log('--- AUTO PAYROLL GENERATION COMPLETE ---');
  } catch (error) {
    console.error('Error during auto payroll:', error);
  }
};

// PRODUCTION SCHEDULE: Runs at 2:00 PM (14:00) on the Last day of Every Month
cron.schedule('0 14 * * *', async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // If tomorrow is the 1st, then today is the last day of the month
    if (tomorrow.getDate() === 1) {
        console.log('Today is the last day of the month (2:00 PM). Triggering auto-payroll...');
        await runAutoPayroll();
    }
}, {
    scheduled: true,
    timezone: "Asia/Kolkata" 
});

// Also provide a way to export the function for manual triggering if needed
module.exports = { runAutoPayroll };
