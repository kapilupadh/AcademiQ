const UniqueId = require('../../models/UniqueId');
const { v4: uuidv4 } = require('uuid');

// Generate Unique ID
exports.generateUniqueId = async (req, res) => {
  try {
    const { role, name, email, expiry_days } = req.body;

    // Validation
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    if (role === 'teacher' && (!name || !email)) {
      return res.status(400).json({ message: 'Name and Email are required for Teacher ID generation.' });
    }

    // Generate custom ID based on role
    // e.g., TCH-2024-XXXX or STD-2024-XXXX
    const prefix = role === 'teacher' ? 'TCH' : 'STD';
    const year = new Date().getFullYear();
    const randomPart = Math.floor(1000 + Math.random() * 9000); // Simple 4 digit random
    const uniqueString = `${prefix}-${year}-${randomPart}`;

    // Check uniqueness (simple check, retry loop ideally but one-off is fine for now)
    const existing = await UniqueId.findOne({ where: { unique_id: uniqueString } });
    if (existing) {
       return res.status(409).json({ message: 'ID Collision. Try again.' });
    }

    const expiryDate = expiry_days 
      ? new Date(Date.now() + expiry_days * 24 * 60 * 60 * 1000) 
      : null;

    const newId = await UniqueId.create({
      unique_id: uniqueString,
      role: role,
      student_name: name || null,  // storing in student_name field for now
      student_email: email || null, // storing in student_email field
      expiry_date: expiryDate,
      status: 'ACTIVE',
      generated_by: req.user ? req.user.id : null // Assuming admin is logged in
    });

    res.status(201).json({
      message: 'Unique ID generated successfully',
      unique_id: newId.unique_id,
      role: newId.role,
      bound_to: {
        name: newId.student_name,
        email: newId.student_email
      }
    });

  } catch (error) {
    console.error('Generate ID Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
