// server/src/modules/attendance/attendanceRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const router = express.Router();
const ctrl = require('./attendanceController');
const { authenticateToken } = require('../../middleware/authMiddleware');
const requireTeacher = require('../../middleware/requireTeacher');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads/attendance');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for attendance selfies
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename to prevent path traversal attacks
    // Use crypto for secure random generation
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    const safeExt = path.extname(file.originalname).replace(/[^a-zA-Z0-9]/g, '');
    cb(null, `selfie-${uniqueSuffix}.${safeExt || 'jpg'}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for high-resolution selfies
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
    }
  }
});

// Multer error handling wrapper for upload routes
const uploadWithErrorHandler = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Image size exceeds 10MB limit.' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

router.use(authenticateToken);

// ── Teacher routes ────────────────────────────────────────────────────────────
router.post('/sessions',                  requireTeacher, ctrl.createSession);
router.post('/sessions/:id/activate',     requireTeacher, ctrl.activateSession);
router.post('/sessions/:id/regenerate',   requireTeacher, ctrl.regenerateCode);
router.post('/sessions/:id/close',        requireTeacher, ctrl.closeSession);
router.get('/sessions',                   requireTeacher, ctrl.getTeacherSessions);
router.get('/sessions/:id',               requireTeacher, ctrl.getSessionStatus);

// ── Admin route ───────────────────────────────────────────────────────────────
router.get('/report',                     ctrl.getAttendanceReport);

// ── Student routes ────────────────────────────────────────────────────────────
router.get('/active-sessions',            ctrl.getActiveSessionsForStudent);
router.get('/my',                         ctrl.getMyAttendance);
router.get('/sessions/:id/available',     ctrl.getSessionForStudent);
router.post('/submit',                    uploadWithErrorHandler, ctrl.submitAttendance);

module.exports = router;