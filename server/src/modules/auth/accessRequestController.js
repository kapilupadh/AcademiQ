const { AccessRequest, User, UniqueId } = require('../../models');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { sendCredentialsEmail } = require('../../utils/emailService');

// Submit a new access request (Public)
exports.submitRequest = async (req, res) => {
  try {
    const { full_name, email, phone, role } = req.body;
    
    if (!full_name || !email || !phone || !role) {
      return res.status(400).json({ message: 'All fields are compulsory including phone number.' });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
    }

    // Check if a request already exists for this email
    const existingRequest = await AccessRequest.findOne({ where: { email, status: 'PENDING' } });
    if (existingRequest) {
      return res.status(400).json({ message: 'A pending request already exists for this email.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const request = await AccessRequest.create({
      full_name,
      email,
      phone,
      role: parseInt(role),
      department: req.body.department // Dynamically capture department from frontend
    });

    // Notify Admin via Socket
    if (global.io) {
      global.io.emit('NEW_ACCESS_REQUEST', request);
    }

    res.status(201).json({ message: 'Access request submitted successfully. Admin will review and email you credentials.' });
  } catch (error) {
    console.error('Submit Request Error:', error);
    res.status(500).json({ message: 'Error submitting request.' });
  }
};

// Get all access requests (Admin Only)
exports.getRequests = async (req, res) => {
  try {
    const requests = await AccessRequest.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests.' });
  }
};

// Approve or Reject a request (Admin Only)
exports.handleAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, admin_notes } = req.body; // action: 'APPROVE' or 'REJECT'

    const request = await AccessRequest.findByPk(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: 'Request has already been processed.' });
    }

    if (action === 'REJECT') {
      await request.update({ status: 'REJECTED', admin_notes });
      if (global.io) global.io.emit('ACCESS_REQUEST_UPDATED', request);
      return res.json({ message: 'Request rejected.' });
    }

    if (action === 'APPROVE') {
      // 1. Generate Unique ID
      const prefix = request.role === 2 ? 'TCH' : 'STU';
      const unique_id = `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`;

      // 2. Generate Random Password
      const plainPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // 3. Create entry in UniqueId table (needed for foreign key constraint)
      await UniqueId.create({
        unique_id: unique_id,
        role: request.role,
        student_name: request.full_name,
        student_email: request.email,
        is_used: true,
        used_date: new Date(),
        status: 'ACTIVE'
      });

      // 4. Link User to their Requested Department
      const { Department } = require('../../models');
      let targetDept = await Department.findOne({ where: { name: request.department } });
      
      // If department somehow doesn't exist, create it dynamically
      if (!targetDept) {
        targetDept = await Department.create({
          name: request.department,
          code: request.department.substring(0, 4).toUpperCase(),
          status: 'ACTIVE'
        });
      }

      // 5. Create User
      const newUser = await User.create({
        full_name: request.full_name,
        email: request.email,
        username: request.email.split('@')[0] + Math.floor(Math.random() * 1000),
        password_hash: hashedPassword,
        role: request.role,
        unique_id: unique_id,
        phone_number: request.phone, // Transfer phone from request
        department_id: targetDept.id,
        program_id: null, // Will be set by user during final registration if needed
        current_semester: request.role === 3 ? 1 : null, 
        is_active: true,
        email_verified: true
      });

      // 6. Update request status
      await request.update({ status: 'APPROVED', admin_notes });

      // 7. Send Email
      await sendCredentialsEmail(request.email, request.full_name, unique_id, plainPassword, request.role);

      // 8. Emit Update
      if (global.io) global.io.emit('ACCESS_REQUEST_UPDATED', request);

      return res.json({ message: 'Request approved and credentials emailed.', user_id: newUser.id });
    }

    res.status(400).json({ message: 'Invalid action.' });
  } catch (error) {
    console.error('Handle Action Error:', error);
    res.status(500).json({ message: 'Error processing request.' });
  }
};

// Delete a request (Admin Only)
exports.deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await AccessRequest.findByPk(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    await request.destroy();
    if (global.io) global.io.emit('ACCESS_REQUEST_DELETED', id);
    res.json({ message: 'Request deleted successfully.' });
  } catch (error) {
    console.error('Delete Request Error:', error);
    res.status(500).json({ message: 'Error deleting request.' });
  }
};
