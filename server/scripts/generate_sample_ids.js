const sequelize = require('../src/config/database');
const UniqueId = require('../src/models/UniqueId');

async function generateIds() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const idsToGenerate = [
      { role: 3, count: 3, prefix: 'STD' }, // 3 Students
      { role: 2, count: 1, prefix: 'TCH', name: 'Dr. Smith', email: 'smith@example.com' } // 1 Teacher
    ];

    const generated = [];

    for (const group of idsToGenerate) {
      for (let i = 0; i < group.count; i++) {
        const year = new Date().getFullYear();
        let uniqueString;
        let exists = true;
        
        // Simple collision avoidance
        while(exists) {
            const randomPart = Math.floor(1000 + Math.random() * 9000);
            uniqueString = `${group.prefix}-${year}-${randomPart}`;
            const found = await UniqueId.findOne({ where: { unique_id: uniqueString } });
            if (!found) exists = false;
        }

        // Create
        const newId = await UniqueId.create({
          unique_id: uniqueString,
          role: group.role,
          student_name: group.name || null,
          student_email: group.email || null,
          status: 'ACTIVE'
        });
        generated.push(newId);
      }
    }

    console.log('\n=== Generated Sample IDs ===');
    generated.forEach(id => {
        console.log(`[${id.role === 2 ? 'TEACHER' : 'STUDENT'}] ID: ${id.unique_id}  ${id.student_name ? `(Name: ${id.student_name})` : ''}`);
    });
    console.log('============================\n');

  } catch (error) {
    console.error('Error generating IDs:', error);
  } finally {
    process.exit();
  }
}

generateIds();
