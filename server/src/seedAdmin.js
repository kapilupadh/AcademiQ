const sequelize = require('./config/database');
const User = require('./models/User');
const UniqueId = require('./models/UniqueId');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const seedAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    const adminEmail = 'admin@localhost.com';
    const adminUniqueIdCode = 'ADMIN-00001';

    // Check if admin exists
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (existingAdmin) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    // Check/Create UniqueId (Required by User model foreign key)
    let uniqueId = await UniqueId.findOne({ where: { unique_id: adminUniqueIdCode } });
    if (!uniqueId) {
      uniqueId = await UniqueId.create({
        unique_id: adminUniqueIdCode,
        role: 1, // Admin
        status: 'ACTIVE',
        student_name: 'System Admin',
        student_email: adminEmail,
        is_used: true
      });
      console.log('Created Admin UniqueId');
    }

    // Hash Password
    // Hardcoded in the script as requested
    const password = 'AdminPassword123!'; 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Admin User
    await User.create({
      id: uuidv4(),
      email: adminEmail,
      password_hash: hashedPassword,
      role: 1, // Admin
      is_active: true,
      unique_id: adminUniqueIdCode,
      username: 'admin',
      full_name: 'System Admin',
      email_verified: true
    });

    console.log('Admin user created successfully.');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${password}`);
    
    process.exit(0);

  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
