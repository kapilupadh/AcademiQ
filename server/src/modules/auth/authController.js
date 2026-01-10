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
      message: 'Unique ID validated. Proceed to registration.' 
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
      role: 'student', // Default rule as per request
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
    res.status(500).json({ message: 'Registration Failed' });
  }
};

// --- API 4: Login ---
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

    // 4. Generate Token (Simple Mock Token for V1 or actually implement JWT if secret exists)
    // Ideally: const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      }
      // token: token
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
