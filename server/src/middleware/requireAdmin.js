
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    // Should not happen if authenticateToken runs first, but guard anyway
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (Number(req.user.role) !== 1) {
    console.warn(`[requireAdmin] Access denied for user ${req.user.id} with role ${req.user.role}`);
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }

  next();
};

module.exports = requireAdmin;