async function testSingle() {
  try {
    const jwt = require('jsonwebtoken');
    require('dotenv').config({ path: 'd:/AcademiQ/server/.env' });
    
    const adminToken = jwt.sign(
      { id: '123e4567-e89b-12d3-a456-426614174000', role: 1 }, 
      process.env.JWT_SECRET || 'dev_secret_key_123', 
      { expiresIn: '1h' }
    );

    console.log('Sending Single ID Request...');
    const res = await fetch('http://localhost:5000/api/admin/generate-id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        role: 'student'
      })
    });
    
    const data = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}

testSingle();
