const pool = require("../config/db");
const bcrypt = require("bcryptjs");


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

const resetPassword = async (req, res) => {

    try {

        const userId = req.params.id;

        const {
            newPassword
        } = req.body;

        if (
            !newPassword ||
            newPassword.length < 6
        ) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
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
                message: "User not found"
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
            message: "Password reset successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

module.exports = {
  getProfile,
  resetPassword
};