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

const app = express();

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
  app.use(morgan('dev'));
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

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/roles', roleRoutes);

// Simple Welcome Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Office Management API' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
