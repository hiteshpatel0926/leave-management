const pool = require("../config/db");

const getDashboardStats = async (req, res) => {
  try {
    const role = req.user.role;

    // ---------- ADMIN ----------
    if (role === "ADMIN") {
      const employees = await pool.query(`SELECT COUNT(*) total FROM employees`);
      const pending = await pool.query(`SELECT COUNT(*) total FROM leave_requests WHERE status='PENDING'`);
      const approved = await pool.query(`SELECT COUNT(*) total FROM leave_requests WHERE status='APPROVED'`);
      const rejected = await pool.query(`SELECT COUNT(*) total FROM leave_requests WHERE status='REJECTED'`);
      const activeEmployees = await pool.query(`SELECT COUNT(*) total FROM employees WHERE status = 'ACTIVE'`);
      const upcomingHolidays = await pool.query(
        `SELECT holiday_name, holiday_date
         FROM holidays
         WHERE holiday_date >= CURRENT_DATE
         ORDER BY holiday_date
         LIMIT 5`
      );

      return res.json({
        role: "ADMIN",
        totalEmployees: Number(employees.rows[0].total),
        pendingLeaves: Number(pending.rows[0].total),
        approvedLeaves: Number(approved.rows[0].total),
        rejectedLeaves: Number(rejected.rows[0].total),
        activeEmployees: Number(activeEmployees.rows[0].total),
        upcomingHolidays: upcomingHolidays.rows,
      });
    }

    // ---------- EMPLOYEE ----------
    // 1. Get employee details (id, gender)
    const employee = await pool.query(
      `SELECT id, gender FROM employees WHERE user_id = $1`,
      [req.user.userId]
    );
    if (employee.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const employeeId = employee.rows[0].id;
    const gender = employee.rows[0].gender; // 'Male' or 'Female'
    const currentYear = new Date().getFullYear();

    // 2. Get all active leave types
    const leaveTypesResult = await pool.query(
      `SELECT * FROM leave_types WHERE active = true`
    );
    const allLeaveTypes = leaveTypesResult.rows;

    // 3. Filter leave types by gender (same logic as createEmployee)
    const filteredLeaveTypes = allLeaveTypes.filter((leaveType) => {
      const nameLower = leaveType.name.toLowerCase();
      if (nameLower.includes("paternity")) return gender === "Male";
      if (nameLower.includes("maternity")) return gender === "Female";
      return true;
    });

    // 4. Calculate total entitlement (sum of annual_entitlement)
    const totalEntitlement = filteredLeaveTypes.reduce(
      (sum, lt) => sum + (lt.annual_entitlement || 0),
      0
    );

    // 5. Get remaining balance from leave_balances (excluding LOP)
    const balance = await pool.query(
      `SELECT COALESCE(SUM(balance_days), 0) AS total
       FROM leave_balances
       WHERE employee_id = $1 AND year = $2 AND leave_type_id != 6`,
      [employeeId, currentYear]
    );
    const remainingBalance = Number(balance.rows[0].total);

    // 6. Get leave request sums - separate for regular leaves vs LOP
    // Regular approved days (excluding LOP)
    const regularApproved = await pool.query(
      `SELECT COALESCE(SUM(total_days), 0) AS total
       FROM leave_requests
       WHERE employee_id = $1
         AND status = 'APPROVED'
         AND leave_type_id != 6`,
      [employeeId]
    );
    const usedLeaveDays = Number(regularApproved.rows[0].total);

    // LOP approved days
    const lopApproved = await pool.query(
      `SELECT COALESCE(SUM(total_days), 0) AS total
       FROM leave_requests
       WHERE employee_id = $1
         AND status = 'APPROVED'
         AND leave_type_id = 6`,
      [employeeId]
    );
    const lopDaysTaken = Number(lopApproved.rows[0].total);

    // Pending and rejected days (all leave types, including LOP if needed)
    const pendingResult = await pool.query(
      `SELECT COALESCE(SUM(total_days), 0) AS total
       FROM leave_requests
       WHERE employee_id = $1 AND status = 'PENDING'`,
      [employeeId]
    );
    const rejectedResult = await pool.query(
      `SELECT COALESCE(SUM(total_days), 0) AS total
       FROM leave_requests
       WHERE employee_id = $1 AND status = 'REJECTED'`,
      [employeeId]
    );

    // 7. Upcoming holidays
    const upcomingHolidays = await pool.query(
      `SELECT holiday_name, holiday_date
       FROM holidays
       WHERE holiday_date >= CURRENT_DATE
       ORDER BY holiday_date
       LIMIT 5`
    );

    // 8. Send response
    res.json({
      role: "EMPLOYEE",
      totalEntitlement: totalEntitlement,   // e.g., 43 Male, 211 Female
      usedLeaveDays: usedLeaveDays,         // approved days without LOP
      lopDaysTaken: lopDaysTaken,           // approved LOP days
      remainingBalance: remainingBalance,
      pendingLeaves: Number(pendingResult.rows[0].total),
      approvedLeaves: usedLeaveDays + lopDaysTaken, // total approved days (including LOP)
      rejectedLeaves: Number(rejectedResult.rows[0].total),
      upcomingHolidays: upcomingHolidays.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { getDashboardStats };