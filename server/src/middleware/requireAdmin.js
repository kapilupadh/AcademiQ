const jwt = require('jsonwebtoken');

const requireAdmin = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access Denied. No token provided.' });
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'temp_secret_key_123';
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user from payload
    req.user = decoded;

    // Check if role is Admin (1) or Teacher (2) for Exam Engine visibility
    const roleNum = Number(decoded.role);
    if (roleNum !== 1 && roleNum !== 2) {
      console.warn(`[requireAdmin] Access Denied. User Role: ${decoded.role}`);
      return res.status(403).json({ message: 'Access Denied. Admins or Teachers only.' });
    }

    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid Token.' });
  }
};

module.exports = requireAdmin;
