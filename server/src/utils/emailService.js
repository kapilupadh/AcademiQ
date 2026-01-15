const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    //For One Time Password OTP
    user: 'kapilupadhyaya6000@gmail.com',
    pass: 'qeri zbcn axph xvgc'
  }
});

const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: '"AcademiQ Support" <kapilupadhyaya6000@gmail.com>',
    to: email,
    subject: 'AcademiQ - Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
        <p style="color: #555;">Hello,</p>
        <p style="color: #555;">You requested a password reset for your AcademiQ account. Please use the following One-Time Password (OTP) to proceed:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="display: inline-block; padding: 15px 30px; font-size: 24px; font-weight: bold; color: #fff; background-color: #007bff; border-radius: 5px; letter-spacing: 5px;">
            ${otp}
          </span>
        </div>

        <p style="color: #555;">This OTP is valid for <strong>2 minutes</strong>.</p>
        <p style="color: #777; font-size: 12px; margin-top: 30px;">If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="text-align: center; color: #999; font-size: 12px;">&copy; ${new Date().getFullYear()} AcademiQ. All rights reserved.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTP };
