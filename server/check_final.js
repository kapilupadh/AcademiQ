const sequelize = require('./src/config/database');
const { Department, User, Subject } = require('./src/models');

async function checkDb() {
  try {
    await sequelize.authenticate();
    const depts = await Department.findAll();
    console.log('--- Departments ---');
    depts.forEach(d => console.log(`${d.name} (${d.id})`));

    const teachers = await User.findAll({ where: { role: 2 } });
    console.log('\n--- Teachers ---');
    teachers.forEach(t => console.log(`${t.email} - Dept: ${t.department_id}`));

    const subjects = await Subject.findAll();
    console.log('\n--- Subjects ---');
    subjects.forEach(s => console.log(`${s.name} - Dept: ${s.department_id}`));

    const students = await User.findAll({ where: { role: 3 } });
    console.log('\n--- Students ---');
    students.forEach(s => console.log(`${s.email} - Dept: ${s.department_id}`));

    const { Assignment } = require('./src/models');
    const assignments = await Assignment.findAll();
    console.log('\n--- Assignments ---');
    console.log(`Total Assignments: ${assignments.length}`);
    assignments.forEach(a => console.log(`- ${a.title} (Subject ID: ${a.subject_id})`));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkDb();
