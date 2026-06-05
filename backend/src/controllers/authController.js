const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  // ... (unchanged)
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Case-insensitive email lookup using LOWER()
    const result = await pool.query(
      `SELECT u.*, e.status AS employee_status
       FROM users u
       LEFT JOIN employees e ON e.user_id = u.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (user.employee_status && user.employee_status !== "ACTIVE") {
      return res.status(403).json({
        message: "Your account is inactive. Please contact your administrator.",
        code: "INACTIVE_ACCOUNT",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
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
    res.status(500).json({ message: "Server Error" });
  }
};

const getProfile = async (req, res) => {
  // ... (unchanged)
};

const changePassword = async (req, res) => {
  // ... (unchanged)
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // Case-insensitive lookup
    const userResult = await pool.query(
      'SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    if (userResult.rows.length === 0) {
      // For security, still return success (don't reveal if email exists)
      return res.json({ message: 'If that email exists, we sent a reset link.' });
    }

    const user = userResult.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      `UPDATE users 
       SET reset_password_token = $1, reset_password_expires = $2
       WHERE id = $3`,
      [token, expires, user.id]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendResetEmail(user.email, resetUrl);

    res.json({ message: 'If that email exists, we sent a reset link.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const userResult = await pool.query(
      `SELECT id FROM users 
       WHERE reset_password_token = $1 
       AND reset_password_expires > NOW()`,
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE users 
       SET password = $1, reset_password_token = NULL, reset_password_expires = NULL
       WHERE id = $2`,
      [hashedPassword, userResult.rows[0].id]
    );

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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
