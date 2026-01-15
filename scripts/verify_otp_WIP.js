const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';
const TEST_EMAIL = 'test_student@example.com'; // Must be a valid user in DB
const TEST_PASSWORD = 'new_password_123';

// Mock function since we can't easily read email in script without IMAP
// In real world, we would query the DB to get the OTP for the test user.
// Since we have direct access to DB via code, we could require the model, 
// strictly speaking this is an integration test.
// For this script, I'll rely on the "DEV ONLY" console log or I can 
// make a temporary "get-otp" endpoint or just query DB if I run this as a task inside server context.

// However, running as a standalone script:
// I will just test the "Send OTP" endpoint returns success.
// I cannot verify the OTP fully without DB access.
// SO, I will construct this script to be run *with* DB access or 
// I will rely on the user to input the OTP? No, that's manual.

// REVISED PLAN:
// I will write a script that connects to the DB to fetch the OTP.

const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('academiq_db', 'postgres', 'password', { // Adjust creds!
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, primaryKey: true },
    username: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    password_hash: { type: DataTypes.STRING },
    otp: { type: DataTypes.STRING },
    otp_expires_at: { type: DataTypes.DATE }
}, { tableName: 'Users', timestamps: true });

async function verifyFlow() {
  try {
    console.log('--- Starting Verification Flow ---');

    // 1. Send OTP
    console.log(`1. Requesting OTP for ${TEST_EMAIL}...`);
    try {
        await axios.post(`${BASE_URL}/forgot-password`, { email: TEST_EMAIL });
        console.log('   ✅ OTP Request Successful');
    } catch (e) {
        console.error('   ❌ OTP Request Failed:', e.response?.data || e.message);
        process.exit(1);
    }

    // 2. Fetch OTP from DB
    console.log('2. Fetching OTP from Database...');
    const user = await User.findOne({ where: { email: TEST_EMAIL } });
    if (!user || !user.otp) {
        console.error('   ❌ User or OTP not found in DB');
        process.exit(1);
    }
    
    // We hashed the OTP in the controller! 
    // Wait, controller line: `const hashedOTP = await bcrypt.hash(otp, 10);`
    // So we CANNOT know the plain OTP from DB to send back to verify endpoint!
    // This makes automated black-box testing hard.
    
    // Alternative: 
    // For this test script to work, we'd need to intercept the email OR
    // temporarily disable hashing in controller (not recommended) OR
    // use a specific test mode.
    
    // Actually, I can allow the controller to return the OTP in the response 
    // IF the environment is 'development'.
    
    console.log('   ⚠️ Cannot retrieve plain OTP from DB because it is hashed.');
    console.log('   ⚠️ Skipping OTP Verification step in automated script.');
    console.log('   ⚠️ Please Verify Manually via Email.');

  } catch (error) {
    console.error('Unexpected Error:', error);
  } finally {
    await sequelize.close();
  }
}

verifyFlow();
