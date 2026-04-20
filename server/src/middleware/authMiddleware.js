const jwt = require('jsonwebtoken');

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ message: 'Access Token Required' });

  const JWT_SECRET = process.env.JWT_SECRET || 'secret';
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('[authMiddleware] JWT Verification Failed:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};