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

    // Check if role is Admin (1)
    if (decoded.role !== 1) {
      return res.status(403).json({ message: 'Access Denied. Admins only.' });
    }

    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid Token.' });
  }
};

module.exports = requireAdmin;
