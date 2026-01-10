const sequelize = require('./config/database');
const UniqueId = require('./models/UniqueId');
// Import all models to ensure relations are created correctly
const User = require('./models/User');
const RegistrationSession = require('./models/RegistrationSession');

const seedIds = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    // Force sync to drop existing tables (with old schema) and create new ones (with new schema)
    // WARNING: This deletes all data. Safe for initial setup.
    await sequelize.sync({ force: true });
    console.log('Database Schema Synced (Tables Recreated)');

    const ids = [
      {
        unique_id: 'CS-2024-001',
        student_name: 'Seed User 1',
        status: 'ACTIVE',
        is_used: false
      },
      {
        unique_id: 'CS-2024-002',
        student_name: 'Seed User 2',
        status: 'ACTIVE',
        is_used: false
      },
      {
        unique_id: 'CS-2024-003',
        status: 'INACTIVE', // Test inactive
        is_used: false
      },
      {
         unique_id: 'CS-2024-004',
         status: 'ACTIVE',
         is_used: true // Test used
      }
    ];

    for (const idData of ids) {
       // Check if exists to avoid duplicate error on re-run
       const exists = await UniqueId.findOne({ where: { unique_id: idData.unique_id }});
       if (!exists) {
         await UniqueId.create(idData);
         console.log(`Created: ${idData.unique_id}`);
       } else {
         console.log(`Skipped (Exists): ${idData.unique_id}`);
       }
    }

    console.log('Seeding Complete');
    process.exit(0);

  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
};

seedIds();
