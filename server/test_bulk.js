async function testBulk() {
  try {
    // 1. Get an Admin Token first
    // Note: We need a valid token. Since the backend doesn't check password for API tokens right now in test,
    // let's grab the dev secret and generate a quick token for an admin
    const jwt = require('jsonwebtoken');
    require('dotenv').config({ path: 'd:/AcademiQ/server/.env' });
    
    const adminToken = jwt.sign(
      { id: '123e4567-e89b-12d3-a456-426614174000', role: 1 }, 
      process.env.JWT_SECRET || 'dev_secret_key_123', 
      { expiresIn: '1h' }
    );

    console.log('Sending Bulk Request...');
    const res = await fetch('http://localhost:5000/api/admin/students/bulk-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        students: [
          { name: 'Bulk Student 1', email: 'bulk1@example.com' },
          { name: 'Bulk Student 2', email: 'bulk2@example.com' },
          { name: 'Invalid Student', email: 'bulk1@example.com' } // Duplicate
        ]
      })
    });
    
    const data = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}

testBulk();
