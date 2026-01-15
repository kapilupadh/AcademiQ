const User = require('../../models/User');
const UniqueId = require('../../models/UniqueId');
const RegistrationSession = require('../../models/RegistrationSession');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// --- API 1: Validate Unique ID ---
exports.validateId = async (req, res) => {
  try {
    const { unique_id } = req.body;

    // 1. Check existence and status
    const idRecord = await UniqueId.findOne({ where: { unique_id } });

    if (!idRecord) {
      return res.status(404).json({ message: 'Invalid Unique ID' });
    }

    if (idRecord.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Unique ID is INACTIVE' });
    }

    if (idRecord.is_used) {
      return res.status(400).json({ message: 'Unique ID has already been used' });
    }

    if (idRecord.expiry_date && new Date() > new Date(idRecord.expiry_date)) {
      return res.status(400).json({ message: 'Unique ID has expired' });
    }

    // 2. Generate Session Token
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    await RegistrationSession.create({
      unique_id: unique_id,
      session_token: sessionToken,
      expires_at: expiresAt,
      status: 'PENDING'
    });

    res.json({ 
      valid: true, 
      session_token: sessionToken, 
      message: 'Unique ID validated. Proceed to registration.',
      role: idRecord.role,
      bound_data: {
        name: idRecord.student_name,
        email: idRecord.student_email
      }
    });

  } catch (error) {
    console.error('Validate ID Error:', error);
    res.status(500).json({ message: 'Server Validation Error' });
  }
};

// --- API 2: Check Email ---
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    
    // Don't leak too much info, just return availability
    res.json({ available: !existingUser });
  } catch (error) {
    console.error('Check Email Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- API 3: Register ---
exports.register = async (req, res) => {
  try {
    const { 
      unique_id, 
      session_token, 
      username, 
      email, 
      password, 
      full_name, 
      dob 
    } = req.body;

    console.log('--- Register Attempt ---');
    console.log('Payload:', { unique_id, session_token, email });
    console.log('Checking Session for:', { unique_id, session_token });
    console.log('Current Time:', new Date());

    // 1. Validate Session Token
    const session = await RegistrationSession.findOne({
      where: { 
        session_token, 
        unique_id,
        status: 'PENDING',
        expires_at: { [Op.gt]: new Date() } // Expires > Now
      }
    });

    if (!session) {
      return res.status(400).json({ message: 'Invalid or Expired Session. Please validate ID again.' });
    }

    // 2. Final Validations (Double Check)
    const idRecord = await UniqueId.findOne({ where: { unique_id } });
    if (!idRecord || idRecord.is_used) {
       return res.status(400).json({ message: 'Unique ID is invalid or already used.' });
    }

    // STRICT TEACHER VALIDATION
    if (idRecord.role === 'teacher') {
      const inputName = full_name.trim().toLowerCase();
      const boundName = (idRecord.student_name || '').trim().toLowerCase();
      const inputEmail = email.trim().toLowerCase();
      const boundEmail = (idRecord.student_email || '').trim().toLowerCase();

      if (inputName !== boundName || inputEmail !== boundEmail) {
        return res.status(400).json({ 
          message: 'Registration Failed: Name and Email must match the details provided by Admin for this Teacher ID.' 
        });
      }
    }

    const emailExists = await User.findOne({ where: { email } });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already registered.' });
    }
    
    const usernameExists = await User.findOne({ where: { username } });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username already taken.' });
    }

    // 3. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create User (Ideally use Transaction)
    // Create User
    const newUser = await User.create({
      unique_id,
      username,
      email,
      password_hash: hashedPassword,
      full_name,
      dob,
      role: idRecord.role, // Use role from UniqueId (admin, teacher, student)
      is_active: true,
      email_verified: false, // Default false until verify
      registered_date: new Date()
    });

    // Mark ID as Used
    await idRecord.update({
      is_used: true,
      used_date: new Date()
    });

    // Invalidate Session
    await session.update({ status: 'COMPLETED' });

    // 5. Generate JWT (Mock for now)
    // In a real app, you would sign a token here:
    // const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.status(201).json({ 
      message: 'Registration successful. Please login.',
      userId: newUser.id
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: error.message || 'Registration Failed' });
  }
};

// --- API 4: Login ---
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { login_id, password } = req.body; // login_id can be username or email

    // 1. Find User
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: login_id },
          { username: login_id }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 2. Check Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Check Active Status
    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is inactive. Contact Admin.' });
    }

    // 4. Generate Token
    const JWT_SECRET = process.env.JWT_SECRET || 'temp_secret_key_123';
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      },
      token: token
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- API 5: Forgot Password ---
const { sendOTP } = require('../../utils/emailService');


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Security: Don't reveal if user exists
      return res.status(200).json({ message: 'If an account exists with this email, an OTP has been sent.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Hash OTP for security (optional but good practice, here we store plain for simplicity/debugging as per plan to just log)
    // Actually, plan said "Hash OTP", but let's stick to plain for V1 or hash it. 
    // Let's store plain for now to ensure it works easily, or we can use bcrypt. 
    // Given the prompt "verifyOTP endpoint", we need to compare.
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Update User
    await user.update({
      otp: hashedOTP,
      otp_expires_at: otpExpiresAt
    });

    console.log(`[DEV ONLY] OTP for ${email}: ${otp}`); // For manual testing if email fails

    // Send Email
    const emailResult = await sendOTP(email, otp);
    
    if (emailResult.success) {
      res.json({ message: 'OTP sent to your email. It expires in 2 minutes.' });
    } else {
      res.status(500).json({ message: `Failed to send email: ${emailResult.error}` });
    }

  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- API 6: Verify OTP ---
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !user.otp || !user.otp_expires_at) {
      return res.status(400).json({ message: 'Invalid request or OTP expired.' });
    }

    // Check Expiry
    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // OTP Verified. Generate Reset Token (valid for 5 mins)
    // NOTE: In production, store this secret in .env
    const JWT_SECRET = process.env.JWT_SECRET || 'temp_secret_key_123';
    
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, purpose: 'password_reset' }, 
      JWT_SECRET, 
      { expiresIn: '5m' }
    );

    // Clear OTP fields to prevent reuse (optional, or clear on reset)
    // We will clear them on successful reset.

    res.json({ 
      message: 'OTP verified.',
      resetToken: resetToken
    });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- API 7: Reset Password ---
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    const JWT_SECRET = process.env.JWT_SECRET || 'temp_secret_key_123';

    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ message: 'Invalid token purpose.' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Hash New Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update Password and Clear OTP
    await user.update({
      password_hash: hashedPassword,
      otp: null,
      otp_expires_at: null
    });

    res.json({ message: 'Password reset successful. You can now login.' });

  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- API 8: Get Profile ---
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash', 'otp', 'otp_expires_at'] }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

// --- API 9: Update Profile ---
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, dob } = req.body;
    const user = await User.findByPk(req.user.id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update allowed fields
    if (full_name) user.full_name = full_name;
    if (dob) user.dob = dob;
    
    await user.save();

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// --- API 10: Change Password ---
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    // Update with new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password_hash = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password' });
  }
};
