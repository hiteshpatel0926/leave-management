const pool = require("../config/db");

const getMyLeaveBalances = async (req, res) => {
  try {
    const employee = await pool.query(
      `
        SELECT id
        FROM employees
        WHERE user_id = $1
        `,
      [req.user.userId],
    );

    if (employee.rows.length === 0) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const employeeId = employee.rows[0].id;

    const currentYear = new Date().getFullYear();

    const result = await pool.query(
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
        WHERE
          lb.employee_id = $1
          AND lb.year = $2
        ORDER BY lt.name
        `,
      [employeeId, currentYear],
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

module.exports = {
  getMyLeaveBalances,
};
