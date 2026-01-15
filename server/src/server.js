const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');

// Import models (Triggers associations in models/index.js)
const db = require('./models');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./modules/auth/authRoutes');
const examRoutes = require('./modules/exam/examRoutes');
const adminRoutes = require('./modules/admin/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/admin', adminRoutes);

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
    await sequelize.sync({ alter: true }); 
    console.log('✅ Models synchronized.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

startServer();
