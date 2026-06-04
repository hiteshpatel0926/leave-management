const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { name, email, password, role, dob, gender } = req.body;

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
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
      [name, email, hashedPassword, role, dob, gender]
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
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
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

    res.status(500).json({
      message: "Server Error",
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
      [req.user.userId]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });
  }
};

const changePassword = async (
  req,
  res
) => {

  try {

    const userId =
      req.user.userId;

    const {
      currentPassword,
      newPassword,
      confirmPassword
    } = req.body;

    if (
      newPassword !==
      confirmPassword
    ) {
      return res.status(400).json({
        message:
          "Passwords do not match"
      });
    }

    if (
      newPassword.length < 6
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters"
      });
    }

    const user =
      await pool.query(
        `
        SELECT *
        FROM users
        WHERE id = $1
        `,
        [userId]
      );

    if (
      user.rows.length === 0
    ) {
      return res.status(404).json({
        message:
          "User not found"
      });
    }

    const isMatch =
      await bcrypt.compare(
        currentPassword,
        user.rows[0].password
      );

    if (!isMatch) {
      return res.status(400).json({
        message:
          "Current password is incorrect"
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );

    await pool.query(
      `
      UPDATE users
      SET password = $1
      WHERE id = $2
      `,
      [
        hashedPassword,
        userId
      ]
    );

    res.json({
      message:
        "Password changed successfully"
    });

  } catch(error){

    console.error(error);

    res.status(500).json({
      message:
        "Server Error"
    });

  }

};


module.exports = {
  register,
  login,
  getProfile,
  changePassword
};