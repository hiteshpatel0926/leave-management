const pool = require("../config/db");

const getProfile = async (req, res) => {
  try {

    const result = await pool.query(
      `
      SELECT
        e.id,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.department,
        e.designation,
        e.joining_date,
        u.email,
        u.role
      FROM employees e
      JOIN users u
      ON e.user_id = u.id
      WHERE u.id = $1
      `,
      [req.user.userId]
    );

    if(result.rows.length === 0){
      return res.status(404).json({
        message:"Employee profile not found"
      });
    }

    res.json(result.rows[0]);

  } catch(error){

    console.error(error);

    res.status(500).json({
      message:"Server Error"
    });

  }
};

module.exports = {
  getProfile
};