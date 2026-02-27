async function test() {
  try {
    console.log('Validating ID...');
    const res1 = await fetch('http://localhost:5000/api/auth/validate-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unique_id: 'CS-2024-001' })
    });
    const data1 = await res1.json();
    console.log('Validate Response:', res1.status, data1);
    
    // Attempt registration
    if (res1.ok && data1.valid) {
      console.log('Registering...');
      const res2 = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unique_id: 'CS-2024-001',
          session_token: data1.session_token,
          username: 'test_student_1',
          email: 'test_student_1@example.com',
          password: 'password123',
          full_name: 'Test Student One',
          dob: '2000-01-01',
          department_id: null
        })
      });
      const data2 = await res2.json();
      console.log('Register Response:', res2.status, data2);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
