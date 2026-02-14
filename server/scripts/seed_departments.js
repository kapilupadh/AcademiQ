const sequelize = require('../src/config/database');
const Department = require('../src/models/Department');

const departments = [
  { name: 'Dept. of Computer Science', code: 'CS' },
  { name: 'Dept. of Physics', code: 'PHY' },
  { name: 'Dept. of Chemistry', code: 'CHEM' },
  { name: 'Dept. of Mathematics', code: 'MATH' },
];

async function seedDepartments() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    
    // Ensure table exists (sync matches server.js)
    await sequelize.sync({ alter: true });

    for (const dept of departments) {
      const [record, created] = await Department.findOrCreate({
        where: { name: dept.name },
        defaults: dept
      });
      if (created) {
        console.log(`Created: ${dept.name}`);
      } else {
        console.log(`Exists: ${dept.name}`);
      }
    }

    console.log('Seeding completed.');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    process.exit();
  }
}

seedDepartments();
