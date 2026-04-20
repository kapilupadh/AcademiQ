//server/src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');

// Import models (Triggers associations in models/index.js)
const db = require('./models');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const path = require('path');

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
}));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, '../public')));

// Routes
const authRoutes = require('./modules/auth/authRoutes');
const examRoutes = require('./modules/exam/examRoutes');
const adminRoutes = require('./modules/admin/adminRoutes');
const teacherRoutes = require('./modules/teacher/teacherRoutes');
const academicRoutes = require('./modules/academic/academicRoutes');
const attendanceRoutes = require('./modules/attendance/attendanceRoutes');


app.use('/api/attendance', attendanceRoutes);
app.use('/api/academics', academicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/departments', require('./modules/department/departmentRoutes'));
app.use('/api/assignments', require('./modules/assignments/assignmentRoutes'));

// Test Route
app.get('/', (req, res) => {
  res.send('AcademiQ Server is Running & DB is Connected!');
});

// Database Connection and Server Start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // Sync models (force: false means it won't drop existing tables)
    // Use { alter: true } only in dev if you want to update columns without dropping
    await sequelize.sync({ alter: false });
    console.log('✅ Models synchronized.');

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

startServer();
