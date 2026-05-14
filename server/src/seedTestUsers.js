// server/src/seedTestUsers.js
const sequelize = require('./config/database');
const { User, UniqueId, Department, Program, Subject, StudentSubject } = require('./models');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database.');

    // 1. Create Department
    const [dept] = await Department.findOrCreate({
      where: { name: 'Computer Science' },
      defaults: { code: 'CS', status: 'ACTIVE' }
    });
    console.log('✅ Department "Computer Science" ready.');

    // 2. Create Program
    const [prog] = await Program.findOrCreate({
      where: { name: 'B.Tech CSE', department_id: dept.id },
      defaults: { code: 'BTCSE', duration_years: 4, is_active: true }
    });
    console.log('✅ Program "B.Tech CSE" ready.');

    // 3. Create Password Hash
    const passwordHash = await bcrypt.hash('Password123!', 10);

    // 4. Create Teacher
    const teacherIdCode = 'TCH-TEST-01';
    await UniqueId.findOrCreate({
      where: { unique_id: teacherIdCode },
      defaults: { role: 2, status: 'ACTIVE', student_name: 'Test Teacher', student_email: 'teacher@academiq.com', is_used: true }
    });

    const [teacher] = await User.findOrCreate({
      where: { email: 'teacher@academiq.com' },
      defaults: {
        id: uuidv4(),
        unique_id: teacherIdCode,
        username: 'teacher',
        password_hash: passwordHash,
        full_name: 'Test Teacher',
        role: 2,
        is_active: true,
        email_verified: true,
        department_id: dept.id
      }
    });
    console.log('✅ Teacher "teacher@academiq.com" ready.');

    // 5. Create Subjects and Assign to Teacher
    const subjectsToSeed = [
      { name: 'DBMS', code: 'CS401', semester: 4 },
      { name: 'Data Structures', code: 'CS201', semester: 2 },
      { name: 'Operating Systems', code: 'CS402', semester: 4 },
      { name: 'Computer Networks', code: 'CS501', semester: 5 },
      { name: 'Artificial Intelligence', code: 'CS601', semester: 6 },
      { name: 'Software Engineering', code: 'CS302', semester: 3 },
    ];

    const seededSubjects = [];
    for (const subData of subjectsToSeed) {
      const [sub] = await Subject.findOrCreate({
        where: { name: subData.name, program_id: prog.id },
        defaults: {
          code: subData.code,
          category: 'Core',
          semester: subData.semester,
          department_id: dept.id,
          teacher_id: teacher.id,
          is_active: true
        }
      });
      seededSubjects.push(sub);
      console.log(`✅ Subject "${subData.name}" ready and assigned to Teacher.`);
    }

    // 6. Create Student
    const studentIdCode = 'STD-TEST-01';
    await UniqueId.findOrCreate({
      where: { unique_id: studentIdCode },
      defaults: { role: 3, status: 'ACTIVE', student_name: 'Test Student', student_email: 'student@academiq.com', is_used: true }
    });

    const [student] = await User.findOrCreate({
      where: { email: 'student@academiq.com' },
      defaults: {
        id: uuidv4(),
        unique_id: studentIdCode,
        username: 'student',
        password_hash: passwordHash,
        full_name: 'Test Student',
        role: 3,
        is_active: true,
        email_verified: true,
        department_id: dept.id,
        program_id: prog.id,
        current_semester: 4
      }
    });
    console.log('✅ Student "student@academiq.com" ready.');

    // 7. Enroll Student in all Seeded Subjects
    for (const sub of seededSubjects) {
      await StudentSubject.findOrCreate({
        where: { student_id: student.id, subject_id: sub.id },
        defaults: { semester: sub.semester, status: 'ENROLLED' }
      });
      console.log(`✅ Student enrolled in "${sub.name}".`);
    }

    console.log('\n🚀 ALL TEST DATA SEEDED SUCCESSFULLY!');
    console.log('--------------------------------------');
    console.log('Teacher Login: teacher@academiq.com / Password123!');
    console.log('Student Login: student@academiq.com / Password123!');
    console.log('--------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
