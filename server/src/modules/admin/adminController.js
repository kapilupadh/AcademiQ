const UniqueId = require('../../models/UniqueId');
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
    const { role, name, email, expiry_days } = req.body;

    if (!role) return res.status(400).json({ message: 'Role is required' });
    if (role === 'teacher' && (!name || !email)) {
      return res.status(400).json({ message: 'Name and Email are required for Teacher ID generation.' });
    }

    const prefix = role === 'teacher' ? 'TCH' : 'STD';
    const year = new Date().getFullYear();
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const uniqueString = `${prefix}-${year}-${randomPart}`;

    const existing = await UniqueId.findOne({ where: { unique_id: uniqueString } });
    if (existing) return res.status(409).json({ message: 'ID Collision. Try again.' });

    const expiryDate = expiry_days
      ? new Date(Date.now() + expiry_days * 24 * 60 * 60 * 1000)
      : null;

    const newId = await UniqueId.create({
      unique_id: uniqueString,
      role,
      student_name: name || null,
      student_email: email || null,
      expiry_date: expiryDate,
      status: 'ACTIVE',
      generated_by: req.user ? req.user.id : null,
    });

    res.status(201).json({
      message: 'Unique ID generated successfully',
      unique_id: newId.unique_id,
      role: newId.role,
      bound_to: { name: newId.student_name, email: newId.student_email },
    });
  } catch (error) {
    console.error('Generate ID Error:', error);
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
