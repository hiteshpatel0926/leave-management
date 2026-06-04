const pool = require("../config/db");

const getEmployeeDetails = async (req, res) => {
  try {

    const employeeId = req.params.id;

    const profile = await pool.query(
      `
      SELECT
        e.*,
        u.email,
        u.role
      FROM employees e
      JOIN users u
        ON e.user_id = u.id
      WHERE e.id = $1
      `,
      [employeeId]
    );

    if (profile.rows.length === 0) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const balances = await pool.query(
      `
      SELECT
        lt.code,
        lt.name,
        lb.entitled_days,
        lb.used_days,
        lb.balance_days
      FROM leave_balances lb
      JOIN leave_types lt
        ON lt.id = lb.leave_type_id
      WHERE lb.employee_id = $1
      ORDER BY lt.name
      `,
      [employeeId]
    );

    const leaves = await pool.query(
      `
      SELECT
        lr.*,
        lt.name AS leave_type
      FROM leave_requests lr
      JOIN leave_types lt
        ON lt.id = lr.leave_type_id
      WHERE lr.employee_id = $1
      ORDER BY lr.applied_at DESC
      `,
      [employeeId]
    );

    res.json({
      profile: profile.rows[0],
      balances: balances.rows,
      leaves: leaves.rows,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });

  }
};

module.exports = {
  getEmployeeDetails,
};