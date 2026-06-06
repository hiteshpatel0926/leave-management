const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // ← must be at the top
const { sendResetEmail } = require("../config/email");

const register = async (req, res) => {
  try {
    const { name, email, password, role, dob, gender } = req.body;

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users(name,email,password,role,dob,gender)
       VALUES($1,$2,$3,$4,$5,$6)
       RETURNING id,name,email,role,dob,gender`,
      [name, email, hashedPassword, role, dob, gender],
    );

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT u.*, e.status AS employee_status
       FROM users u
       LEFT JOIN employees e ON e.user_id = u.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email],
    );

    // 1. Email not registered
    if (result.rows.length === 0) {
      return res.status(404).json({
        message:
          "No account found with this email. Please check your email or contact your administrator to get registered.",
        code: "USER_NOT_REGISTERED",
      });
    }

    const user = result.rows[0];

    // 2. Check employee status (only if linked to an employee)
    if (user.employee_status && user.employee_status !== "ACTIVE") {
      return res.status(403).json({
        message:
          "Your account has been deactivated. Reach out to your administrator to restore access.",
        code: "ACCOUNT_INACTIVE",
      });
    }

    // 3. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Incorrect email or password. Please try again.",
        code: "INVALID_CREDENTIALS",
      });
    }

    // 4. Success - generate token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        message:
          "Something went wrong on our end. Please try again in a moment.",
      });
  }
};

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        e.*,
        u.email,
        u.role,
        u.dob,
        u.gender
      FROM employees e
      JOIN users u
        ON e.user_id = u.id
      WHERE u.id = $1
      `,
      [req.user.userId],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const user = await pool.query(`SELECT * FROM users WHERE id = $1`, [
      userId,
    ]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.rows[0].password,
    );
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [
      hashedPassword,
      userId,
    ]);

    // Return a flag indicating the user must re-login
    res.json({
      message:
        "Password changed successfully. Please log in again with your new password.",
      needsRelogin: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Find user and join with employees to get status
    const userResult = await pool.query(
      `SELECT u.id, u.email, e.status AS employee_status
       FROM users u
       LEFT JOIN employees e ON e.user_id = u.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email],
    );

    // 2. If no user found → not authorized
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message:
          "You are not an authorized user. No account found with this email.",
      });
    }

    const user = userResult.rows[0];

    // 3. If the user is linked to an employee and that employee is INACTIVE → block
    if (user.employee_status && user.employee_status !== "ACTIVE") {
      return res.status(403).json({
        message: "Your account is inactive. Please contact your administrator.",
      });
    }

    // 4. Generate reset token (1 hour expiry)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000);

    await pool.query(
      `UPDATE users 
       SET reset_password_token = $1, reset_password_expires = $2
       WHERE id = $3`,
      [token, expires, user.id],
    );

    // 5. Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendResetEmail(user.email, resetUrl);

    // 6. Return success (same message for both existing and non‑existing emails for security)
    res.json({
      message:
        "If that email exists and the account is active, we sent a reset link.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const userResult = await pool.query(
      `SELECT id FROM users 
       WHERE reset_password_token = $1 
       AND reset_password_expires > NOW()`,
      [token],
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE users 
       SET password = $1, reset_password_token = NULL, reset_password_expires = NULL
       WHERE id = $2`,
      [hashedPassword, userResult.rows[0].id],
    );

    res.json({ message: "Password reset successful. You can now login." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
