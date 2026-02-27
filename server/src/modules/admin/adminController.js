const UniqueId = require('../../models/UniqueId');
const User = require('../../models/User');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const XLSX = require('xlsx');
const multer = require('multer');

// Multer: memory storage for Excel upload (no disk write needed)
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
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) or CSV files are accepted.'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

exports.excelUpload = excelUpload;

// ── Single ID generation (existing) ────────────────────────────────────────
exports.generateUniqueId = async (req, res) => {
  try {
    console.log('[generateUniqueId] Request received. Body:', req.body);
    const { role, name, email, expiry_days } = req.body;

    if (!role) {
      console.error('[generateUniqueId] Role is missing.');
      return res.status(400).json({ message: 'Role is required' });
    }
    if (role === 'teacher' && (!name || !email)) {
      console.error('[generateUniqueId] Missing name or email for teacher role.');
      return res.status(400).json({ message: 'Name and Email are required for Teacher ID generation.' });
    }

    let roleInt = 3;
    let prefix = 'STD';
    if (role === 'admin') {
      roleInt = 1;
      prefix = 'ADM';
    } else if (role === 'teacher') {
      roleInt = 2;
      prefix = 'TCH';
    }

    const year = new Date().getFullYear();
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const uniqueString = `${prefix}-${year}-${randomPart}`;
    
    console.log('[generateUniqueId] Generated ID string:', uniqueString);

    const existing = await UniqueId.findOne({ where: { unique_id: uniqueString } });
    if (existing) {
      console.error('[generateUniqueId] ID Collision detected for string:', uniqueString);
      return res.status(409).json({ message: 'ID Collision. Try again.' });
    }

    const expiryDate = expiry_days
      ? new Date(Date.now() + expiry_days * 24 * 60 * 60 * 1000)
      : null;

    console.log('[generateUniqueId] Attempting database insert. Payload:', {
      unique_id: uniqueString, role: roleInt, student_name: name || null, student_email: email || null,
      expiry_date: expiryDate, status: 'ACTIVE', generated_by: req.user ? req.user.id : null
    });
    
    let newId;
    try {
      newId = await UniqueId.create({
        unique_id: uniqueString,
        role: roleInt,
        student_name: name || null,
        student_email: email || null,
        expiry_date: expiryDate,
        status: 'ACTIVE',
        generated_by: req.user ? req.user.id : null,
      });
      console.log('[generateUniqueId] Database insert successful. Inserted PK:', newId.id);
    } catch (dbError) {
      console.error('[generateUniqueId] FULL DB INSERT ERROR OBJECT:', dbError);
      return res.status(500).json({ message: 'Database insert failed. Check logs.' });
    }

    console.log('[generateUniqueId] Explicitly verifying insert by running a SELECT query...');
    const verifyInsert = await UniqueId.findOne({ where: { unique_id: uniqueString } });
    if (!verifyInsert) {
      console.error('[generateUniqueId] Verification failed! ID was not found after insert. Likely rolled back.');
      return res.status(500).json({ message: 'Verification failed. Database rollback suspected.' });
    }
    console.log('[generateUniqueId] Verification successful. Confirmed ID is securely stored in DB.');

    console.log('[generateUniqueId] Sending success response to frontend...');
    res.status(201).json({
      message: 'Unique ID generated successfully',
      unique_id: newId.unique_id,
      role: newId.role, // will return 1, 2 or 3
      bound_to: { name: newId.student_name, email: newId.student_email },
    });
  } catch (error) {
    console.error('[generateUniqueId] FULL FUNCTION ERROR OBJECT:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ── Bulk Student ID Generation via Excel ───────────────────────────────────
/**
 * POST /api/admin/bulk-generate-ids
 * Accepts: multipart/form-data with field "file" (Excel or CSV)
 * Required columns (case-insensitive, order doesn't matter):
 *   First Name, Last Name, Roll No, Phone, Email, Parents Name, DOB, Batch, Department, Course
 * Returns: Excel file (application/octet-stream) with Name + Unique ID for each student
 */
exports.bulkGenerateIds = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload an Excel file.' });

    // Parse workbook from buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows || rows.length === 0) {
      return res.status(400).json({ message: 'The Excel file appears to be empty.' });
    }

    // Helper: find a column value case-insensitively
    const get = (row, ...keys) => {
      for (const key of keys) {
        for (const col of Object.keys(row)) {
          if (col.trim().toLowerCase() === key.toLowerCase()) return String(row[col] || '').trim();
        }
      }
      return '';
    };

    const year = new Date().getFullYear();
    const results = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row number (1-indexed header + 1)

      const firstName = get(row, 'first name', 'firstname', 'first_name');
      const lastName  = get(row, 'last name', 'lastname', 'last_name');
      const fullName  = `${firstName} ${lastName}`.trim() || get(row, 'name', 'student name', 'full name');
      const rollNo    = get(row, 'roll no', 'roll number', 'roll_no', 'university roll no', 'exam roll no');
      const email     = get(row, 'email', 'email address');
      const phone     = get(row, 'phone', 'phone number', 'mobile', 'contact');
      const parents   = get(row, 'parents name', 'parent name', 'father name', 'guardian');
      const dob       = get(row, 'dob', 'date of birth', 'birth date');
      const batch     = get(row, 'batch', 'year');
      const dept      = get(row, 'department', 'dept', 'dept.');
      const course    = get(row, 'course', 'degree', 'course/degree', 'program');

      if (!fullName) {
        errors.push({ row: rowNum, issue: 'Missing student name' });
        continue;
      }

      // Generate unique ID with collision retry
      let uniqueString;
      let attempts = 0;
      do {
        const rand = Math.floor(1000 + Math.random() * 90000); // 5-digit
        uniqueString = `STD-${year}-${rand}`;
        const exists = await UniqueId.findOne({ where: { unique_id: uniqueString } });
        if (!exists) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        errors.push({ row: rowNum, issue: 'Could not generate unique ID (collision)' });
        continue;
      }

      await UniqueId.create({
        unique_id: uniqueString,
        role: 3, // Student
        student_name: fullName,
        student_email: email || null,
        status: 'ACTIVE',
        generated_by: req.user?.id || null,
      });

      results.push({
        'Student Name': fullName,
        'Roll No': rollNo,
        'Email': email,
        'Phone': phone,
        'Parents Name': parents,
        'DOB': dob,
        'Batch': batch,
        'Department': dept,
        'Course/Degree': course,
        'Unique ID': uniqueString,
      });
    }

    if (results.length === 0) {
      return res.status(422).json({
        message: 'No valid student rows found in the file.',
        errors,
      });
    }

    // Build output Excel
    const outWb  = XLSX.utils.book_new();
    const outWs  = XLSX.utils.json_to_sheet(results);
    XLSX.utils.book_append_sheet(outWb, outWs, 'Generated IDs');
    const buffer = XLSX.write(outWb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="student_unique_ids_${year}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    if (errors.length > 0) res.setHeader('X-Skipped-Rows', errors.length.toString());
    res.send(buffer);

  } catch (error) {
    console.error('bulkGenerateIds error:', error);
    res.status(500).json({ message: error.message || 'Server error during bulk generation.' });
  }
};

// --- Frontend-Driven Bulk Generate Students Array ---
exports.bulkGenerateStudentsFrontend = async (req, res) => {
  try {
    const { students } = req.body; // Expects array of { name, email }
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'Missing or invalid students array.' });
    }

    const year = new Date().getFullYear();
    const results = [];
    const errors = [];
    let successCount = 0;
    
    // We fetch all existing emails from users to avoid generating IDs for already registered people
    const existingUsers = await User.findAll({ attributes: ['email'] });
    const existingEmailsRegex = new Set(existingUsers.map(u => u.email?.toLowerCase()).filter(Boolean));

    const generatedIds = new Set(); // To prevent internal collisions within the same batch
    const processedEmails = new Set(); // To prevent duplicate emails within the SAME payload array

    for (const student of students) {
      const email = student.email?.trim().toLowerCase();
      const name = student.name?.trim();

      if (!name || !email) {
        errors.push({ name, email, reason: 'Name and Email are required.' });
        continue;
      }

      // Check internal duplicate in same payload
      if (processedEmails.has(email)) {
        errors.push({ name, email, reason: 'Duplicate email detected within this file.' });
        continue;
      }
      processedEmails.add(email);

      // Check if email already registered as User
      if (existingEmailsRegex.has(email)) {
        errors.push({ name, email, reason: 'Email already exists in Users table.' });
        continue;
      }

      // Check if email already has an active Unique ID generated for them
      const existingId = await UniqueId.findOne({
        where: {
          student_email: { [Op.iLike]: email }
        }
      });

      if (existingId) {
        errors.push({ name, email, reason: 'An ID has already been generated for this email.' });
        continue;
      }

      // Generate a collision-free Unique ID
      let uniqueString;
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        uniqueString = `STD-${year}-${randomPart}`;
        
        if (generatedIds.has(uniqueString)) {
          attempts++;
          continue; // collision within the current batch
        }

        const collisionCheck = await UniqueId.findOne({ where: { unique_id: uniqueString } });
        if (!collisionCheck) {
          isUnique = true;
          generatedIds.add(uniqueString);
        } else {
          attempts++;
        }
      }

      if (!isUnique) {
        errors.push({ name, email, reason: 'ID collision generation failed. System busy.' });
        continue;
      }

      // Push to bulk insert queue
      results.push({
        unique_id: uniqueString,
        role: 3, // Student
        student_name: name,
        student_email: email,
        status: 'ACTIVE',
        generated_by: req.user?.id || null,
      });
      successCount++;
    }

    // Perform batch insert
    if (results.length > 0) {
      await UniqueId.bulkCreate(results);
    }

    res.status(200).json({
      message: 'Bulk generation process completed.',
      successCount,
      failedCount: errors.length,
      data: results.map(r => ({
        Name: r.student_name,
        Email: r.student_email,
        'Unique ID': r.unique_id,
        Role: 'Student'
      })),
      errors,
    });
  } catch (error) {
    console.error('bulkGenerateStudentsFrontend error:', error);
    res.status(500).json({ message: error.message || 'Server error during bulk ID array generation.' });
  }
};
