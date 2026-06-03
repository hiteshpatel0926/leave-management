const pool = require("../config/db");

const getDashboardStats = async (
  req,
  res
) => {

  try {

    const role = req.user.role;

    if (role === "ADMIN") {

      const employees =
        await pool.query(
          `
          SELECT COUNT(*) total
          FROM employees
          `
        );

      const pending =
        await pool.query(
          `
          SELECT COUNT(*) total
          FROM leave_requests
          WHERE status='PENDING'
          `
        );

      const approved =
        await pool.query(
          `
          SELECT COUNT(*) total
          FROM leave_requests
          WHERE status='APPROVED'
          `
        );

      const rejected =
        await pool.query(
          `
          SELECT COUNT(*) total
          FROM leave_requests
          WHERE status='REJECTED'
          `
        );

      return res.json({
        role: "ADMIN",
        totalEmployees:
          Number(
            employees.rows[0].total
          ),
        pendingLeaves:
          Number(
            pending.rows[0].total
          ),
        approvedLeaves:
          Number(
            approved.rows[0].total
          ),
        rejectedLeaves:
          Number(
            rejected.rows[0].total
          )
      });

    }

    const employee =
      await pool.query(
        `
        SELECT id
        FROM employees
        WHERE user_id=$1
        `,
        [req.user.userId]
      );

    const employeeId =
      employee.rows[0].id;

    const currentYear =
      new Date().getFullYear();

    const balance =
      await pool.query(
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
        [
          employeeId,
          currentYear
        ]
      );

    const pending =
      await pool.query(
        `
        SELECT COUNT(*) total
        FROM leave_requests
        WHERE employee_id=$1
        AND status='PENDING'
        `,
        [employeeId]
      );

    const approved =
      await pool.query(
        `
        SELECT COUNT(*) total
        FROM leave_requests
        WHERE employee_id=$1
        AND status='APPROVED'
        `,
        [employeeId]
      );

    const rejected =
      await pool.query(
        `
        SELECT COUNT(*) total
        FROM leave_requests
        WHERE employee_id=$1
        AND status='REJECTED'
        `,
        [employeeId]
      );

    res.json({

      role: "EMPLOYEE",

      leaveBalance:
        Number(
          balance.rows[0].total
        ),

      pendingLeaves:
        Number(
          pending.rows[0].total
        ),

      approvedLeaves:
        Number(
          approved.rows[0].total
        ),

      rejectedLeaves:
        Number(
          rejected.rows[0].total
        )

    });

  } catch(error){

    console.error(error);

    res.status(500).json({
      message:"Server Error"
    });

  }

};

module.exports = {
  getDashboardStats
};