const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,     // e.g., smtp.gmail.com
  port: process.env.SMTP_PORT,     // 587
  secure: false,                   // true for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendResetEmail = async (to, resetUrl) => {
  const mailOptions = {
    from: `"Leave Management" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Reset Your Password</h2>
        <p>You requested a password reset. Click the link below to set a new password.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link expires in <strong>1 hour</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr />
        <p style="font-size: 12px; color: #666;">Leave Management System</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendResetEmail };