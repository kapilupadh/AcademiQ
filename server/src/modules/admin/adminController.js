const UniqueId = require('../../models/UniqueId');
const User = require('../../models/User');
const { Op } = require('sequelize');
const XLSX = require('xlsx');
const multer = require('multer');

const storage = multer.memoryStorage();
const excelUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else cb(new Error('Only Excel (.xlsx, .xls) or CSV files are accepted.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});
exports.excelUpload = excelUpload;

// ── ID Generation ───────────────────────────────────────────────────────────
exports.generateUniqueId = async (req, res) => {
  try {
    const { role, name, email, expiry_days } = req.body;
    if (!role) return res.status(400).json({ message: 'Role is required' });
    if (role === 'teacher' && (!name || !email))
      return res.status(400).json({ message: 'Name and Email are required for Teacher ID generation.' });

    let roleInt = 3, prefix = 'STD';
    if (role === 'admin') { roleInt = 1; prefix = 'ADM'; }
    else if (role === 'teacher') { roleInt = 2; prefix = 'TCH'; }

    const year = new Date().getFullYear();
    const uniqueString = `${prefix}-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    const existing = await UniqueId.findOne({ where: { unique_id: uniqueString } });
    if (existing) return res.status(409).json({ message: 'ID Collision. Try again.' });

    const expiryDate = expiry_days ? new Date(Date.now() + expiry_days * 24 * 60 * 60 * 1000) : null;
    const newId = await UniqueId.create({
      unique_id: uniqueString, role: roleInt,
      student_name: name || null, student_email: email || null,
      expiry_date: expiryDate, status: 'ACTIVE',
      generated_by: req.user ? req.user.id : null,
    });
    res.status(201).json({ message: 'Unique ID generated successfully', unique_id: newId.unique_id, role: newId.role, bound_to: { name: newId.student_name, email: newId.student_email } });
  } catch (err) {
    console.error('[generateUniqueId]', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.bulkGenerateIds = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload an Excel file.' });
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
    if (!rows.length) return res.status(400).json({ message: 'Excel file is empty.' });

    const get = (row, ...keys) => {
      for (const key of keys)
        for (const col of Object.keys(row))
          if (col.trim().toLowerCase() === key.toLowerCase()) return String(row[col] || '').trim();
      return '';
    };

    const year = new Date().getFullYear();
    const results = [], errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const firstName = get(row, 'first name', 'firstname', 'first_name');
      const lastName = get(row, 'last name', 'lastname', 'last_name');
      const fullName = `${firstName} ${lastName}`.trim() || get(row, 'name', 'student name', 'full name');
      if (!fullName) { errors.push({ row: i + 2, issue: 'Missing student name' }); continue; }

      let uniqueString, attempts = 0;
      do {
        uniqueString = `STD-${year}-${Math.floor(1000 + Math.random() * 90000)}`;
        const exists = await UniqueId.findOne({ where: { unique_id: uniqueString } });
        if (!exists) break;
        attempts++;
      } while (attempts < 10);
      if (attempts >= 10) { errors.push({ row: i + 2, issue: 'Could not generate unique ID' }); continue; }

      await UniqueId.create({ unique_id: uniqueString, role: 3, student_name: fullName, student_email: get(row, 'email') || null, status: 'ACTIVE', generated_by: req.user?.id || null });
      results.push({ 'Student Name': fullName, 'Roll No': get(row, 'roll no', 'roll number'), 'Email': get(row, 'email'), 'Unique ID': uniqueString });
    }

    if (!results.length) return res.status(422).json({ message: 'No valid rows found.', errors });
    const outWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(outWb, XLSX.utils.json_to_sheet(results), 'Generated IDs');
    const buffer = XLSX.write(outWb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="student_ids_${year}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('bulkGenerateIds error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

exports.bulkGenerateStudentsFrontend = async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || !students.length)
      return res.status(400).json({ message: 'Missing or invalid students array.' });

    const year = new Date().getFullYear();
    const results = [], errors = [];
    const existingUsers = await User.findAll({ attributes: ['email'] });
    const existingEmails = new Set(existingUsers.map(u => u.email?.toLowerCase()).filter(Boolean));
    const generatedIds = new Set(), processedEmails = new Set(), processedRollNos = new Set();

    for (const student of students) {
      const email = student.email?.trim().toLowerCase();
      const name = student.name?.trim();
      const rollNo = student.rollNo?.trim();

      if (!name) { errors.push({ name, email, rollNo, reason: 'Name is required.' }); continue; }
      if (!email && !rollNo) { errors.push({ name, email, rollNo, reason: 'Email or Roll No required.' }); continue; }

      if (email) {
        if (processedEmails.has(email)) { errors.push({ name, email, rollNo, reason: 'Duplicate email.' }); continue; }
        processedEmails.add(email);
        if (existingEmails.has(email)) { errors.push({ name, email, rollNo, reason: 'Email already registered.' }); continue; }
        const existingId = await UniqueId.findOne({ where: { student_email: { [Op.iLike]: email } } });
        if (existingId) { errors.push({ name, email, rollNo, reason: 'ID already generated.' }); continue; }
      }
      if (rollNo) {
        if (processedRollNos.has(rollNo)) { errors.push({ name, email, rollNo, reason: 'Duplicate roll no.' }); continue; }
        processedRollNos.add(rollNo);
      }

      let uniqueString, isUnique = false, attempts = 0;
      while (!isUnique && attempts < 10) {
        uniqueString = `STD-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
        if (!generatedIds.has(uniqueString)) {
          const check = await UniqueId.findOne({ where: { unique_id: uniqueString } });
          if (!check) { isUnique = true; generatedIds.add(uniqueString); }
          else attempts++;
        } else attempts++;
      }
      if (!isUnique) { errors.push({ name, email, reason: 'ID collision.' }); continue; }
      results.push({ unique_id: uniqueString, role: 3, student_name: name, student_email: email || null, status: 'ACTIVE', generated_by: req.user?.id || null, _rollNo: rollNo || '' });
    }

    if (results.length > 0) await UniqueId.bulkCreate(results.map(({ _rollNo, ...rest }) => rest));
    res.status(200).json({
      message: 'Bulk generation completed.',
      successCount: results.length, failedCount: errors.length,
      data: results.map(r => ({ Name: r.student_name, 'Roll No': r._rollNo, Email: r.student_email || 'N/A', 'Unique ID': r.unique_id })),
      errors: errors.map(e => ({ name: e.name, email: e.email || `Roll No: ${e.rollNo}`, reason: e.reason })),
    });
  } catch (err) {
    console.error('bulkGenerateStudentsFrontend error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── Departments ─────────────────────────────────────────────────────────────
exports.getDepartments = async (req, res) => {
  try {
    const { Department } = require('../../models');
    const depts = await Department.findAll({
      where: { status: 'ACTIVE' },
      attributes: ['id', 'name', 'code'],
      order: [['name', 'ASC']],
    });
    res.json(depts);
  } catch (err) {
    console.error('getDepartments error:', err);
    res.status(500).json({ message: 'Error fetching departments' });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { Department } = require('../../models');
    const { name, code } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Department name is required.' });

    const existing = await Department.findOne({ where: { name: name.trim() } });
    if (existing) return res.status(409).json({ message: `"${name.trim()}" already exists.`, department: existing });

    const dept = await Department.create({
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : name.trim().slice(0, 6).toUpperCase(),
      status: 'ACTIVE',
    });
    res.status(201).json({ message: 'Department created.', department: dept });
  } catch (err) {
    console.error('createDepartment error:', err);
    res.status(500).json({ message: 'Error creating department' });
  }
};

// ── Programs ────────────────────────────────────────────────────────────────
exports.getProgramsByDepartment = async (req, res) => {
  try {
    const { Program } = require('../../models');
    const programs = await Program.findAll({
      where: { department_id: req.params.deptId, is_active: true },
      attributes: ['id', 'name', 'code', 'duration_years'],
      order: [['name', 'ASC']],
    });
    res.json(programs);
  } catch (err) {
    console.error('getProgramsByDepartment error:', err);
    res.status(500).json({ message: 'Error fetching programs' });
  }
};

// ── Subjects management ─────────────────────────────────────────────────────
exports.getSubjectsByProgram = async (req, res) => {
  try {
    const { Subject } = require('../../models');
    const subjects = await Subject.findAll({
      where: { program_id: req.params.programId },
      attributes: ['id', 'name', 'code', 'category', 'semester', 'is_active'],
      order: [['semester', 'ASC'], ['name', 'ASC']],
    });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching subjects' });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const { Subject } = require('../../models');
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found.' });

    const { name, code, category, semester } = req.body;
    await subject.update({
      ...(name !== undefined && { name: name.trim() }),
      ...(code !== undefined && { code: code.trim() || null }),
      ...(category !== undefined && { category }),
      ...(semester !== undefined && { semester: parseInt(semester) }),
    });
    res.json({ message: 'Subject updated.', subject });
  } catch (err) {
    console.error('updateSubject error:', err);
    res.status(500).json({ message: 'Error updating subject' });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const { Subject } = require('../../models');
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found.' });
    await subject.destroy();
    res.json({ message: 'Subject deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting subject' });
  }
};

exports.clearProgramSubjects = async (req, res) => {
  try {
    const { Subject } = require('../../models');
    const count = await Subject.destroy({ where: { program_id: req.params.programId } });
    res.json({ message: `Cleared ${count} subjects.`, count });
  } catch (err) {
    res.status(500).json({ message: 'Error clearing subjects' });
  }
};

// ── Excel parser helper ──────────────────────────────────────────────────────
const parseSemesterFromString = (raw) => {
  if (!raw) return null;
  const val = String(raw).replace(/\s+/g, ' ').trim().toLowerCase();
  const ordinalMatch = val.replace(/\s/g, '').match(/^(\d+)(st|nd|rd|th)semester$/i);
  if (ordinalMatch) return parseInt(ordinalMatch[1]);
  const semNumMatch = val.match(/^semester\s*(\d)$/);
  if (semNumMatch) return parseInt(semNumMatch[1]);
  const num = parseInt(val);
  if (!isNaN(num) && num >= 1 && num <= 8) return num;
  return null;
};

const getCategoryFromCode = (code) => {
  if (!code) return null;
  const c = code.toUpperCase().replace(/\s/g, '');
  if (/^C-?\d/.test(c) || /^C\d/.test(c)) return 'Core';
  if (c.startsWith('MINOR')) return 'Minor';
  if (c.startsWith('GEC')) return 'GEC';
  if (c.startsWith('AEC')) return 'AEC';
  if (c.startsWith('VAC')) return 'VAC';
  if (c.startsWith('SEC')) return 'SEC';
  if (c.startsWith('RM') || c.startsWith('RESEARCH')) return 'Research';
  if (c.startsWith('DSE') || c.startsWith('DISSERTATION')) return 'DSE';
  if (c.startsWith('INTERNSHIP')) return 'Internship';
  return code.trim();
};

const parseExcelBuffer = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!rawRows || rawRows.length < 2)
    return { error: 'Excel file is empty or has no data rows.' };

  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(5, rawRows.length); i++) {
    const row = rawRows[i].map(c => String(c).toLowerCase().replace(/\s+/g, ' ').trim());
    if (row.some(c => c.includes('year') || c.includes('semester')) && row.some(c => c.includes('course'))) {
      headerRowIdx = i; break;
    }
  }

  const headers = rawRows[headerRowIdx].map(c => String(c).trim());
  const findCol = (...names) => {
    for (const name of names) {
      const idx = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const yearCol   = findCol('year', 'semester');
  const courseCol = findCol('course');
  const titleCol  = findCol('title', 'paper', 'subject');

  if (yearCol === -1 || courseCol === -1 || titleCol === -1)
    return { error: `Could not find required columns in [${headers.join(', ')}]. Expected: Year, Course, Title of the paper.` };

  const parsed = [];
  const rowErrors = [];
  
  // TRACKING VARIABLES
  let lastSemester = null;
  let lastCourse = null; // Added to track course codes for empty cells

  const dataRows = rawRows.slice(headerRowIdx + 1);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNum = headerRowIdx + i + 2;
    const yearVal   = String(row[yearCol]  || '').trim();
    let courseVal = String(row[courseCol] || '').trim(); // Changed to let
    const titleVal  = String(row[titleCol]  || '').trim();

    if (yearVal) {
      const sem = parseSemesterFromString(yearVal);
      if (sem) lastSemester = sem;
    }

    // Check for completely blank row before applying carry-over
    if (!courseVal && !titleVal) continue;

    // Apply Course carry-over logic
    if (courseVal) {
      lastCourse = courseVal; // Remember new course
    } else if (lastCourse) {
      courseVal = lastCourse; // Apply remembered course to empty cell
    }

    if (!titleVal) {
      rowErrors.push({ row: rowNum, issue: `Missing title (Course: "${courseVal}")` });
      continue;
    }
    if (!lastSemester) {
      rowErrors.push({ row: rowNum, issue: `Cannot determine semester for "${titleVal}"` });
      continue;
    }

    parsed.push({
      rowNum,
      name: titleVal,
      code: courseVal || null,
      category: getCategoryFromCode(courseVal),
      semester: lastSemester,
    });
  }

  return { parsed, rowErrors };
};

// ── POST /admin/subjects/preview ────────────────────────────────────────────
exports.previewSubjectImport = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload an Excel file.' });

    const { parsed, rowErrors, error } = parseExcelBuffer(req.file.buffer);
    if (error) return res.status(400).json({ message: error });

    const bySemester = {};
    for (const s of parsed) {
      if (!bySemester[s.semester]) bySemester[s.semester] = [];
      bySemester[s.semester].push(s);
    }

    res.json({
      totalRows: parsed.length,
      semesters: bySemester,
      rowErrors: rowErrors.length > 0 ? rowErrors : undefined,
    });
  } catch (err) {
    console.error('previewSubjectImport error:', err);
    res.status(500).json({ message: err.message || 'Server error during preview.' });
  }
};

// ── POST /admin/subjects/bulk-import ────────────────────────────────────────
exports.bulkImportSubjects = async (req, res) => {
  try {
    const { Department, Program, Subject } = require('../../models');

    if (!req.file) return res.status(400).json({ message: 'Please upload an Excel file.' });

    const { department_id, program_name, program_code, duration_years, replace } = req.body;
    if (!department_id) return res.status(400).json({ message: 'department_id is required.' });
    if (!program_name)  return res.status(400).json({ message: 'program_name is required.' });

    const dept = await Department.findByPk(department_id);
    if (!dept) return res.status(404).json({ message: 'Department not found.' });

    const [program, programCreated] = await Program.findOrCreate({
      where: { name: program_name.trim(), department_id },
      defaults: {
        name: program_name.trim(),
        code: (program_code || program_name).trim().toUpperCase(),
        department_id,
        duration_years: parseInt(duration_years) || 3,
        is_active: true,
      },
    });

    if (replace === 'true' || replace === true) {
      await Subject.destroy({ where: { program_id: program.id } });
    }

    const { parsed, rowErrors, error } = parseExcelBuffer(req.file.buffer);
    if (error) return res.status(400).json({ message: error });

    let created = 0, skipped = 0;
    const dbErrors = [];

    for (const item of parsed) {
      try {
        const [, wasCreated] = await Subject.findOrCreate({
          where: { name: item.name, semester: item.semester, program_id: program.id },
          defaults: { name: item.name, code: item.code, category: item.category, semester: item.semester, program_id: program.id, department_id, is_active: true },
        });
        wasCreated ? created++ : skipped++;
      } catch (dbErr) {
        dbErrors.push({ row: item.rowNum, issue: dbErr.message });
        skipped++;
      }
    }

    res.status(200).json({
      message: 'Import complete.',
      department: dept.name, program: program.name, programCreated,
      created, skipped,
      errors: [...(rowErrors || []), ...dbErrors].length > 0
        ? [...(rowErrors || []), ...dbErrors]
        : undefined,
    });
  } catch (err) {
    console.error('bulkImportSubjects error:', err);
    res.status(500).json({ message: err.message || 'Server error during subject import.' });
  }
};