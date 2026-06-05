// backend/src/config/email.js
const nodemailer = require("nodemailer");

// Create transporter using SMTP settings from .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetUrl - Password reset link
 * @returns {Promise<void>}
 */
const sendResetEmail = async (to, resetUrl) => {
  const mailOptions = {
    from: `"Leave Management System" <${process.env.SMTP_USER}>`,
    to,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #4F46E5;">Reset Your Password</h2>
        <p>You requested a password reset for your Leave Management account.</p>
        <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;" />
        <p style="font-size: 12px; color: #666;">Leave Management System – Secure Employee Portal</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${to}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    
    // If using Ethereal, log the preview URL
    if (process.env.SMTP_HOST === 'smtp.ethereal.email') {
      console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw new Error("Email sending failed");
  }
};

module.exports = { sendResetEmail };