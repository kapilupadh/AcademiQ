// server/src/modules/attendance/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('./attendanceController');
const { authenticateToken } = require('../../middleware/authMiddleware');
const requireTeacher = require('../../middleware/requireTeacher');

router.use(authenticateToken);

// ── Teacher routes ────────────────────────────────────────────────────────────
router.post('/sessions',                    requireTeacher, ctrl.createSession);
router.post('/sessions/:id/activate',       requireTeacher, ctrl.activateSession);
router.post('/sessions/:id/regenerate',     requireTeacher, ctrl.regenerateCode);
router.post('/sessions/:id/close',          requireTeacher, ctrl.closeSession);
router.get('/sessions',                     requireTeacher, ctrl.getTeacherSessions);
router.get('/sessions/:id',                 requireTeacher, ctrl.getSessionStatus);

// ── Student routes ────────────────────────────────────────────────────────────
router.get('/my',                           ctrl.getMyAttendance);
router.get('/sessions/:id/available',       ctrl.getSessionForStudent);
router.post('/submit',                      ctrl.submitAttendance);

module.exports = router;