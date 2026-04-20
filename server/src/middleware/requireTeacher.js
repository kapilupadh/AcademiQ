const { User } = require('../models');

const requireTeacher = async (req, res, next) => {
  try {
    // ── DEVELOPMENT MODE BYPASS ──────────────────────────────────────────────
    if (req.user && req.user.id && req.user.id.startsWith('dev-')) {
      if (req.user.role === 2 || req.user.role === 1) {
        return next();
      }
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 2 && user.role !== 1) { // 2 is Teacher, 1 is Admin
      return res.status(403).json({ message: 'Access Denied. Teacher role required.' });
    }

    req.userDetails = user;
    next();
  } catch (error) {
    console.error('requireTeacher error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = requireTeacher;
