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

module.exports = {
  register,
  login,
  getProfile,
  changePassword,
};
