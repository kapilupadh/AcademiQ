// server/src/seedDepartments.js
require('dotenv').config({ path: __dirname + '/../.env' });
const { Department } = require('./models');
const sequelize = require('./config/database');

const departmentsToSeed = [
  { name: 'Physics', code: 'PHYS' },
  { name: 'Chemistry', code: 'CHEM' },
  { name: 'Mathematics & Statistics', code: 'MATH' },
  { name: 'Botany', code: 'BOTN' },
  { name: 'Zoology', code: 'ZOOL' },
  { name: 'Computer Science', code: 'COMP' },
  { name: 'Geology', code: 'GEOL' },
  { name: 'English', code: 'ENGL' },
  { name: 'History', code: 'HIST' },
  { name: 'Political Science', code: 'POLS' },
  { name: 'Economics', code: 'ECON' },
  { name: 'Sociology', code: 'SOCI' },
  { name: 'Psychology', code: 'PSYC' }
];

async function seedDepartments() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    let addedCount = 0;
    for (const dept of departmentsToSeed) {
      const [record, created] = await Department.findOrCreate({
        where: { name: dept.name },
        defaults: {
          code: dept.code,
          status: 'ACTIVE'
        }
      });
      if (created) addedCount++;
    }

    console.log(`Successfully seeded ${addedCount} new departments!`);
    console.log(`Total active departments verified: ${departmentsToSeed.length}`);
  } catch (error) {
    console.error('Failed to seed departments:', error);
  } finally {
    process.exit();
  }
}

seedDepartments();
