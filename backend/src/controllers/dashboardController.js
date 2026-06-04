const pool = require("../config/db");

const getDashboardStats = async (req, res) => {
  try {
    const role = req.user.role;

    if (role === "ADMIN") {
      const employees = await pool.query(
        `
          SELECT COUNT(*) total
          FROM employees
          `,
      );

      const pending = await pool.query(
        `
          SELECT COUNT(*) total
          FROM leave_requests
          WHERE status='PENDING'
          `,
      );

      const approved = await pool.query(
        `
          SELECT COUNT(*) total
          FROM leave_requests
          WHERE status='APPROVED'
          `,
      );

      const rejected = await pool.query(
        `
          SELECT COUNT(*) total
          FROM leave_requests
          WHERE status='REJECTED'
          `,
      );

      const activeEmployees = await pool.query(`
            SELECT COUNT(*) total
            FROM employees
            WHERE status = 'ACTIVE'
      `);

      const upcomingHolidays = await pool.query(
        `
            SELECT
              holiday_name,
              holiday_date
            FROM holidays
            WHERE holiday_date >= CURRENT_DATE
            ORDER BY holiday_date
            LIMIT 5
            `,
      );

      return res.json({
        role: "ADMIN",
        totalEmployees: Number(employees.rows[0].total),
        pendingLeaves: Number(pending.rows[0].total),
        approvedLeaves: Number(approved.rows[0].total),
        rejectedLeaves: Number(rejected.rows[0].total),
        activeEmployees: Number(activeEmployees.rows[0].total),
        upcomingHolidays: upcomingHolidays.rows
      });
    }

    const employee = await pool.query(
      `
        SELECT id
        FROM employees
        WHERE user_id=$1
        `,
      [req.user.userId],
    );

    const employeeId = employee.rows[0].id;

    const currentYear = new Date().getFullYear();

    const balance = await pool.query(
      `
        SELECT
        COALESCE(
          SUM(balance_days),
          0
        ) total
        FROM leave_balances
        WHERE employee_id=$1
        AND year=$2
        `,
      [employeeId, currentYear],
    );

    const pending = await pool.query(
      `
        SELECT COUNT(*) total
        FROM leave_requests
        WHERE employee_id=$1
        AND status='PENDING'
        `,
      [employeeId],
    );

    const approved = await pool.query(
      `
        SELECT COUNT(*) total
        FROM leave_requests
        WHERE employee_id=$1
        AND status='APPROVED'
        `,
      [employeeId],
    );

    const rejected = await pool.query(
      `
        SELECT COUNT(*) total
        FROM leave_requests
        WHERE employee_id=$1
        AND status='REJECTED'
        `,
      [employeeId],
    );

    const upcomingHolidays = await pool.query(
        `
            SELECT
              holiday_name,
              holiday_date
            FROM holidays
            WHERE holiday_date >= CURRENT_DATE
            ORDER BY holiday_date
            LIMIT 5
            `,
      );

    res.json({
      role: "EMPLOYEE",

      leaveBalance: Number(balance.rows[0].total),

      pendingLeaves: Number(pending.rows[0].total),

      approvedLeaves: Number(approved.rows[0].total),

      rejectedLeaves: Number(rejected.rows[0].total),
      upcomingHolidays: upcomingHolidays.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

module.exports = {
  getDashboardStats,
};
