const { sendOTP } = require('../src/utils/emailService');

async function testEmail() {
    console.log('Attempting to send test email...');
    // Use a temporary email or the admin's email for testing
    const testEmail = 'kapilupadhyaya6000@gmail.com'; 
    
    const result = await sendOTP(testEmail, '123456');
    
    if (result.success) {
        console.log('✅ Email sent successfully!');
    } else {
        console.error('❌ Email failed:', result.error);
    }
}

testEmail();
