const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'kapilupadhyaya6000@gmail.com',
    pass: process.env.SMTP_PASS || 'qeri zbcn axph xvgc'
  }
});

const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: `"AcademiQ Support" <${process.env.SMTP_USER || 'kapilupadhyaya6000@gmail.com'}>`,
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

/**
 * Send account credentials to a newly created user.
 */
const sendCredentialsEmail = async (email, name, unique_id, password, role) => {
  const roleName = role === 2 ? 'Teacher' : 'Student';
  const mailOptions = {
    from: `"AcademiQ Admin" <${process.env.SMTP_USER || 'kapilupadhyaya6000@gmail.com'}>`,
    to: email,
    subject: `[AcademiQ] Your ${roleName} Account Credentials`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #1a1a1a; margin: 0; font-size: 24px;">Welcome to AcademiQ</h1>
          <p style="color: #666; font-size: 14px;">Your account has been successfully created</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 25px;">
          <p style="margin: 0 0 15px 0; color: #475569; font-size: 14px;">Hello <strong>${name}</strong>,</p>
          <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.5;">You have been registered as a <strong>${roleName}</strong> in the <strong>BCA</strong> department. Please use the following credentials to access the portal:</p>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-size: 13px; width: 40%;">Unique ID / Login ID</td>
              <td style="padding: 10px 0; font-weight: bold; color: #1e293b; font-family: monospace; font-size: 16px;">${unique_id}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-size: 13px;">Temporary Password</td>
              <td style="padding: 10px 0; font-weight: bold; color: #1e293b; font-family: monospace; font-size: 16px;">${password}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="display: inline-block; padding: 12px 30px; font-size: 14px; font-weight: bold; color: #ffffff; background-color: #000000; border-radius: 6px; text-decoration: none;">
            Login to Portal
          </a>
        </div>

        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 25px;">
          <p style="margin: 0; color: #92400e; font-size: 12px; line-height: 1.5;">
            <strong>Security Notice:</strong> For your security, we recommend changing your password immediately after your first login.
          </p>
        </div>

        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 30px;">
          This is an automated message. Please do not reply to this email.<br>
          &copy; ${new Date().getFullYear()} AcademiQ. All rights reserved.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Credentials sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending credentials email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send exam schedule notification to a list of student emails.
 */
const sendExamScheduleNotification = async (emails, exam, isUpdate = false) => {
  if (!emails || emails.length === 0) return { success: true, sent: 0 };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formatTime = (d) =>
    new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const actionLabel = isUpdate ? 'Updated' : 'Scheduled';
  const headerColor = isUpdate ? '#f59e0b' : '#3b82f6';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background: ${headerColor}; color: white; padding: 16px 20px; border-radius: 6px 6px 0 0; margin: -20px -20px 20px;">
        <h2 style="margin: 0; font-size: 18px;">📋 Exam ${actionLabel} — AcademiQ</h2>
      </div>

      <p style="color: #555;">Dear Student,</p>
      <p style="color: #555;">
        ${isUpdate
          ? 'The schedule for the following exam has been <strong>updated</strong>. Please note the new timings.'
          : 'A new exam has been <strong>scheduled</strong> for you. Please plan accordingly.'}
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 40%;">Exam Name</td>
            <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${exam.title}</td>
          </tr>
          ${exam.departmentName ? `<tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Department</td>
            <td style="padding: 8px 0; color: #1e293b;">${exam.departmentName}</td>
          </tr>` : ''}
          ${exam.semester ? `<tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Semester</td>
            <td style="padding: 8px 0; color: #1e293b;">Semester ${exam.semester}</td>
          </tr>` : ''}
          ${(exam.subjectName || exam.subject) ? `<tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Subject</td>
            <td style="padding: 8px 0; color: #1e293b;">${exam.subjectName || exam.subject}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Exam Type</td>
            <td style="padding: 8px 0; color: #1e293b;">${exam.type}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Date</td>
            <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${formatDate(exam.scheduled_start_at)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Start Time</td>
            <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${formatTime(exam.scheduled_start_at)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">End Time</td>
            <td style="padding: 8px 0; color: #1e293b;">${formatTime(exam.scheduled_end_at)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Duration</td>
            <td style="padding: 8px 0; color: #1e293b;">${exam.duration_minutes} minutes</td>
          </tr>
        </table>
      </div>

      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 12px 16px; margin: 16px 0;">
        <p style="margin: 0; color: #92400e; font-size: 13px;">
          ⚠️ <strong>Important:</strong> Please be present in the lab <strong>before the scheduled time</strong>.
          The exam will only begin when your teacher activates it and provides an OTP.
        </p>
      </div>

      <p style="color: #777; font-size: 12px; margin-top: 24px;">
        This is an automated notification from AcademiQ. Do not reply to this email.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;">
      <p style="text-align: center; color: #999; font-size: 12px;">© ${new Date().getFullYear()} AcademiQ. All rights reserved.</p>
    </div>
  `;

  let sent = 0;
  let failed = 0;

  // Send emails in parallel
  const results = await Promise.allSettled(
    emails.map((email) =>
      transporter.sendMail({
        from: `"AcademiQ Notifications" <${process.env.SMTP_USER || 'kapilupadhyaya6000@gmail.com'}>`,
        to: email,
        subject: `[AcademiQ] Exam ${actionLabel}: ${exam.title}`,
        html,
      })
    )
  );

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      sent++;
      console.log(`[Email] Sent exam notification to ${emails[i]}`);
    } else {
      failed++;
      console.error(`[Email] Failed to send to ${emails[i]}:`, r.reason?.message);
    }
  });

  return { success: failed === 0, sent, failed };
};

module.exports = { sendOTP, sendCredentialsEmail, sendExamScheduleNotification };
