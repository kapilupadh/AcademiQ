const sequelize = require('../src/config/database');
const { Department, Program, Subject, User, UniqueId, StudentSubject, Assignment } = require('../src/models');
const bcrypt = require('bcryptjs');

async function seedForFriend() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected.');

    // 1. Sync tables
    await sequelize.sync({ force: false }); 

    // 2. Create the EXACT Department the Dev Login looks for
    const FIXED_DEPT_ID = '7076ca4c-de22-4b91-88e1-e61bd8a7fbbe';
    const [dept] = await Department.findOrCreate({
      where: { id: FIXED_DEPT_ID },
      defaults: {
        id: FIXED_DEPT_ID,
        name: 'Computer Science Department',
        code: 'CS',
        status: 'ACTIVE'
      }
    });
    console.log('✅ Department ready:', dept.name);

    // 3. Create a Program
    const [program] = await Program.findOrCreate({
      where: { name: 'BCA', department_id: dept.id },
      defaults: {
        name: 'BCA',
        code: 'BCA',
        department_id: dept.id,
        duration_years: 3
      }
    });
    console.log('✅ Program ready:', program.name);

    // 4. Create the EXACT Teacher the Dev Login uses
    // This prevents foreign key errors
    const FIXED_TEACHER_ID = '4518fe3c-3795-4370-bd29-97a51c05021c';
    const FIXED_UNIQUE_ID = 'TCH-DEV-001';

    await UniqueId.findOrCreate({
      where: { unique_id: FIXED_UNIQUE_ID },
      defaults: {
        unique_id: FIXED_UNIQUE_ID,
        role: 2,
        status: 'ACTIVE',
        is_used: true
      }
    });

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const [teacher] = await User.findOrCreate({
      where: { id: FIXED_TEACHER_ID },
      defaults: {
        id: FIXED_TEACHER_ID,
        unique_id: FIXED_UNIQUE_ID,
        username: 'teacher',
        email: 'teacher@academiq.com',
        password_hash: hashedPassword,
        full_name: 'Dev Teacher',
        role: 2,
        department_id: dept.id,
        is_active: true,
        email_verified: true
      }
    });
    console.log('✅ Dev Teacher account ready in database.');

    // 5. Create some Subjects and link them to this Teacher
    const subjects = [
      { name: 'Database Management Systems', code: 'CS101', semester: 1 },
      { name: 'Operating Systems', code: 'CS102', semester: 2 },
      { name: 'Data Structures', code: 'CS103', semester: 3 },
      { name: 'Web Development', code: 'CS104', semester: 4 }
    ];

    for (const sub of subjects) {
      await Subject.findOrCreate({
        where: { code: sub.code },
        defaults: {
          ...sub,
          department_id: dept.id,
          program_id: program.id,
          teacher_id: teacher.id,
          is_active: true
        }
      });
    }
    console.log('✅ Subjects seeded and linked to teacher.');

    // --- 4. Link existing Student accounts to the Department ---
    console.log('🔗 Linking student accounts...');
    
    // 4.1 Ensure the Unique ID exists for the student
    await UniqueId.findOrCreate({
      where: { unique_id: 'CS-STUDENT-001' },
      defaults: {
        unique_id: 'CS-STUDENT-001',
        role: 3,
        status: 'ACTIVE',
        is_used: true
      }
    });

    // 4.2 Ensure the specific student@academiq.com exists
    const studentPassword = await bcrypt.hash('Password123!', 10);
    const [student] = await User.findOrCreate({
      where: { email: 'student@academiq.com' },
      defaults: {
        id: '2d8b29bd-97a5-47e2-8bd9-97a51c05021c', // Dev Student ID
        unique_id: 'CS-STUDENT-001',
        username: 'dev_student',
        email: 'student@academiq.com',
        password_hash: studentPassword,
        full_name: 'Dev Student',
        role: 3,
        department_id: dept.id,
        program_id: program.id,
        current_semester: 1,
        is_active: true,
        email_verified: true
      }
    });

    // 4.3 Enroll ALL students in all seeded subjects
    console.log('📚 Enrolling ALL students in subjects...');
    const allStudents = await User.findAll({ where: { role: 3 } });
    for (const studentUser of allStudents) {
      for (const subInfo of subjects) {
        const sub = await Subject.findOne({ where: { name: subInfo.name } });
        if (sub) {
          await StudentSubject.findOrCreate({
            where: { student_id: studentUser.id, subject_id: sub.id },
            defaults: {
              student_id: studentUser.id,
              subject_id: sub.id
            }
          });
        }
      }
    }

    await User.update(
      { 
        department_id: dept.id,
        program_id: program.id,
        current_semester: 1,
        role: 3 // Ensure they are student
      },
      { 
        where: { email: 'student@academiq.com' }
      }
    );
    console.log('✅ Student account fully synchronized.');

    // 5. Force all assignments to be PUBLISHED so students can see them
    console.log('📢 Publishing and Linking all assignments...');
    
    // Publish
    await Assignment.update(
      { status: 'PUBLISHED' },
      { where: {} }
    );

    // Link EVERY user in the database to every subject (Total Universal Link)
    console.log('🔗 Initializing Student-Subject Links...');
    const everyUser = await User.findAll();
    const everySubject = await Subject.findAll();

    for (const u of everyUser) {
      for (const sub of everySubject) {
        await StudentSubject.findOrCreate({
          where: { student_id: u.id, subject_id: sub.id },
          defaults: {
            student_id: u.id,
            subject_id: sub.id,
            is_eligible: true
          }
        });
      }
    }
    console.log('✅ DATABASE INITIALIZATION COMPLETE!');

    console.log('\n🚀 SETUP SUCCESSFUL! You can now login with:');
    console.log('   Teacher: teacher@academiq.com / Password123!');
    console.log('   Student: student@academiq.com / Password123!');
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    process.exit();
  }
}

seedForFriend();
