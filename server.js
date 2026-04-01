const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize Automated Payroll Scheduler
require('./scripts/payrollScheduler');
console.log('--- AUTO-PAYROLL SCHEDULER ACTIVE ---');

// ONE-TIME MIGRATION: Employee/Payroll -> SalaryMaster
const SalaryMaster = require('./models/SalaryMaster');
const Employee = require('./models/Employee');
const Payroll = require('./models/Payroll');
const runMigration = async () => {
  try {
    const allEmployees = await Employee.find({});
    let migratedCount = 0;

    for (const emp of allEmployees) {
      // 1. Check if SalaryMaster already exists
      let master = await SalaryMaster.findOne({ employee: emp._id });
      if (master) continue;

      let sourceData = null;

      // 2. Try to get from Employee.salaryStructure first
      if (emp.salaryStructure && emp.salaryStructure.netAmount > 0) {
        sourceData = {
          designation: emp.designation,
          grossAmount: emp.salaryStructure.grossAmount,
          totalDeductions: emp.salaryStructure.totalDeductions,
          netAmount: emp.salaryStructure.netAmount,
          earnings: emp.salaryStructure.earnings,
          deductionsList: emp.salaryStructure.deductionsList,
          isAutoGenerate: emp.salaryStructure.isAutoGenerate !== undefined ? emp.salaryStructure.isAutoGenerate : true
        };
      } 
      // 3. If not found, try to get from the latest Payroll record
      else {
        const latestPayroll = await Payroll.findOne({ employee: emp._id }).sort('-paymentDate');
        if (latestPayroll) {
          sourceData = {
            designation: latestPayroll.designation || emp.designation,
            grossAmount: latestPayroll.grossAmount,
            totalDeductions: latestPayroll.totalDeductions,
            netAmount: latestPayroll.netAmount,
            earnings: latestPayroll.earnings,
            deductionsList: latestPayroll.deductionsList,
            isAutoGenerate: true
          };
        }
      }

      if (sourceData) {
        await SalaryMaster.create({
          employee: emp._id,
          ...sourceData
        });
        migratedCount++;
      }
    }
    if (migratedCount > 0) {
      console.log(`--- SALARY MASTER MIGRATION COMPLETE: ${migratedCount} NEW RECORDS ---`);
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
};
runMigration();

const app = express();
const path = require('path');

// Static folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    if (isLocalhost || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    callback(null, true); // Fallback to allow during dev
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  // app.use(morgan('dev'));
  // Skip logging for notifications to reduce noise
  app.use(morgan('dev', {
    skip: (req, res) => req.originalUrl === '/api/notifications'
  }));
}

// Route files
const authRoutes = require('./routes/common/authRoutes');
const employeeRoutes = require('./routes/employee/employeeRoutes');
const departmentRoutes = require('./routes/admin/departmentRoutes');
const announcementRoutes = require('./routes/common/announcementRoutes');
const leaveRoutes = require('./routes/employee/leaveRoutes');
const payrollRoutes = require('./routes/employee/payrollRoutes');
const notificationRoutes = require('./routes/common/notificationRoutes');
const roleRoutes = require('./routes/admin/roleRoutes');
const timesheetRoutes = require('./routes/common/timesheetRoutes');
const documentRoutes = require('./routes/common/documentRoutes');
const holidayRoutes = require('./routes/admin/holidayRoutes');
const uploadRoutes = require('./routes/common/uploadRoutes');
const salaryMasterRoutes = require('./routes/admin/salaryMasterRoutes');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/salary-master', salaryMasterRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/upload', uploadRoutes);

// Simple Welcome Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Office Management API' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
