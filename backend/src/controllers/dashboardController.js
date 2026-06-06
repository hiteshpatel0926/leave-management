const pool = require("../config/db");

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    let userRole = req.user.role;

    if (!userRole) {
      const userRes = await pool.query("SELECT role FROM users WHERE id = $1", [
        userId,
      ]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      userRole = userRes.rows[0].role;
    }

    const year = req.query.year
      ? parseInt(req.query.year)
      : new Date().getFullYear();

    // Upcoming holidays (always based on current date)
    const upcomingHolidaysRes = await pool.query(
      `SELECT id, holiday_name, holiday_date
       FROM holidays
       WHERE holiday_date >= CURRENT_DATE
       ORDER BY holiday_date ASC
       LIMIT 5`,
    );

    // ---------- ADMIN CASE ----------
    if (userRole === "ADMIN") {
      const totalEmpRes = await pool.query("SELECT COUNT(*) FROM employees");
      const totalEmployees = parseInt(totalEmpRes.rows[0].count);

      const activeEmpRes = await pool.query(
        "SELECT COUNT(*) FROM employees WHERE status = 'ACTIVE'",
      );
      const activeEmployees = parseInt(activeEmpRes.rows[0].count);

      // Leave counts for the selected year (for all employees)
      const leavesRes = await pool.query(
        `SELECT status, COUNT(*) as count
         FROM leave_requests
         WHERE EXTRACT(YEAR FROM start_date) = $1
         GROUP BY status`,
        [year],
      );

      let pendingLeaves = 0,
        approvedLeaves = 0,
        rejectedLeaves = 0;
      leavesRes.rows.forEach((row) => {
        if (row.status === "PENDING") pendingLeaves = parseInt(row.count);
        else if (row.status === "APPROVED")
          approvedLeaves = parseInt(row.count);
        else if (row.status === "REJECTED")
          rejectedLeaves = parseInt(row.count);
      });

      // For admin, we can still return a list of years for the year dropdown
      // Get distinct years from leave_requests (or leave_balances) – use any table with year info
      const yearsRes = await pool.query(
        `SELECT DISTINCT EXTRACT(YEAR FROM start_date) as year
         FROM leave_requests
         ORDER BY year DESC`,
      );
      const availableYears = yearsRes.rows.map((r) => r.year);

      res.json({
        role: "ADMIN",
        totalEmployees,
        activeEmployees,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        availableYears,
        upcomingHolidays: upcomingHolidaysRes.rows,
      });
      return;
    }

    // ---------- EMPLOYEE / MANAGER CASE ----------
    const empRes = await pool.query(
      `SELECT id, first_name, last_name, department, designation, manager_id
   FROM employees
   WHERE user_id = $1`,
      [userId],
    );
    if (empRes.rows.length === 0) {
      return res.status(404).json({ message: "Employee record not found" });
    }
    const employeeId = empRes.rows[0].id;

    // ----- Get leave balances for the selected year (for entitlement & remaining) -----
    const balancesRes = await pool.query(
      `SELECT lb.entitled_days, lb.balance_days
   FROM leave_balances lb
   WHERE lb.employee_id = $1 AND lb.year = $2`,
      [employeeId, year],
    );

    let totalEntitlement = 0,
      remainingBalance = 0;
    balancesRes.rows.forEach((b) => {
      totalEntitlement += parseFloat(b.entitled_days);
      remainingBalance += parseFloat(b.balance_days);
    });

    // ----- Used leave days (sum of approved days, excluding LOP) -----
    const usedDaysRes = await pool.query(
      `SELECT SUM(total_days) as total
   FROM leave_requests
   WHERE employee_id = $1
     AND EXTRACT(YEAR FROM start_date) = $2
     AND status = 'APPROVED'
     AND leave_type_id != 6`, // exclude Leave Without Pay
      [employeeId, year],
    );
    let usedLeaveDays = usedDaysRes.rows[0].total
      ? parseFloat(usedDaysRes.rows[0].total)
      : 0;

    // ----- LOP days taken (approved LOP) -----
    const lopDaysRes = await pool.query(
      `SELECT SUM(total_days) as total
   FROM leave_requests
   WHERE employee_id = $1
     AND EXTRACT(YEAR FROM start_date) = $2
     AND status = 'APPROVED'
     AND leave_type_id = 6`,
      [employeeId, year],
    );
    let lopDaysTaken = lopDaysRes.rows[0].total
      ? parseFloat(lopDaysRes.rows[0].total)
      : 0;

    // ----- Pending and rejected counts (number of requests) -----
    const pendingCountRes = await pool.query(
      `SELECT COUNT(*) as count
   FROM leave_requests
   WHERE employee_id = $1
     AND EXTRACT(YEAR FROM start_date) = $2
     AND status = 'PENDING'`,
      [employeeId, year],
    );
    const pendingLeaves = parseInt(pendingCountRes.rows[0].count);

    const rejectedCountRes = await pool.query(
      `SELECT COUNT(*) as count
   FROM leave_requests
   WHERE employee_id = $1
     AND EXTRACT(YEAR FROM start_date) = $2
     AND status = 'REJECTED'`,
      [employeeId, year],
    );
    const rejectedLeaves = parseInt(rejectedCountRes.rows[0].count);

    // Get available years for dropdown
    const yearsRes = await pool.query(
      `SELECT DISTINCT year FROM leave_balances WHERE employee_id = $1 ORDER BY year DESC`,
      [employeeId],
    );
    const availableYears = yearsRes.rows.map((r) => r.year);

    res.json({
      role: userRole,
      totalEntitlement: totalEntitlement.toFixed(2),
      usedLeaveDays: usedLeaveDays.toFixed(2),
      remainingBalance: remainingBalance.toFixed(2),
      lopDaysTaken: lopDaysTaken.toFixed(2),
      pendingLeaves,
      approvedLeaves: usedLeaveDays.toFixed(2), // approved days excluding LOP (as shown in card)
      rejectedLeaves,
      availableYears,
      upcomingHolidays: upcomingHolidaysRes.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getDashboardStats };
