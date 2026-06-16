const pool = require("../config/db");

const getMyProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        e.*,
        CONCAT(m.first_name, ' ', m.last_name) AS manager_name,
        u.role
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN employees m ON e.manager_id = m.id
      WHERE u.id = $1
      `,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Profile not found"
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error"
    });
  }
};

module.exports = {
  getMyProfile
};