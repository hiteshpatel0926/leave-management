// reconcilePL.js
require("dotenv").config(); // Ensure environment variables are loaded
const pool = require("../config/db"); // Use your existing database connection
// No need to create a new Pool – your db config already does that.

// Helper: get current financial year (April 1 start)
function getFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 4 ? year : year - 1;
}

// Helper: get start date of a financial year
function getFinancialYearStart(financialYear) {
  return new Date(financialYear, 3, 1);
}

// Calculate how many PL days an employee should get for a specific calendar month
function getCreditForMonth(joinDate, year, month) {
  const firstOfMonth = new Date(year, month - 1, 1);
  const lastOfMonth = new Date(year, month, 0);
  const join = new Date(joinDate);

  if (join > lastOfMonth) return 0;
  if (join <= firstOfMonth) return 2;

  const joinDay = join.getDate();
  return joinDay < 15 ? 2 : 1;
}

async function reconcilePL() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const today = new Date();
    const currentFY = getFinancialYear(today);
    const fyStart = getFinancialYearStart(currentFY);
    const fyEnd = new Date(currentFY + 1, 2, 31); // March 31 of next year

    // 1. Get all active employees
    const employees = await client.query(`
      SELECT id, joining_date FROM employees WHERE status = 'ACTIVE'
    `);

    for (const emp of employees.rows) {
      const empId = emp.id;
      const joinDate = new Date(emp.joining_date);

      // ---- A. Carry‑forward from previous financial year (capped at 6) ----
      const prevFY = currentFY - 1;
      const prevBalanceRes = await client.query(
        `
        SELECT balance_days
        FROM leave_balances
        WHERE employee_id = $1 AND leave_type_id = 1 AND year = $2
      `,
        [empId, prevFY],
      );
      let prevBalance = prevBalanceRes.rows[0]?.balance_days || 0;
      const carryForward = Math.min(prevBalance, 6);

      // ---- B. Monthly credits from April of currentFY up to today ----
      let monthlyCredits = 0;
      let currentMonth = today.getMonth() + 1;
      let currentYear = today.getFullYear();

      let year = currentFY;
      let month = 4; // April
      while (
        year < currentYear ||
        (year === currentYear && month <= currentMonth)
      ) {
        // Determine calendar year for this month (for proration)
        let calYear = year;
        if (month < 4) calYear = year + 1; // Jan-Mar belong to next calendar year
        const credit = getCreditForMonth(joinDate, calYear, month);
        monthlyCredits += credit;

        month++;
        if (month > 12) {
          month = 1;
          year++;
        }
      }

      const entitledDays = carryForward + monthlyCredits;

      // ---- C. Used days in the current financial year ----
      const usedRes = await client.query(
        `
        SELECT COALESCE(SUM(total_days), 0) AS used
        FROM leave_requests
        WHERE employee_id = $1
          AND leave_type_id = 1
          AND status = 'APPROVED'
          AND start_date >= $2
          AND end_date <= $3
      `,
        [empId, fyStart, fyEnd],
      );
      const usedDays = parseFloat(usedRes.rows[0].used);

      const balanceDays = entitledDays - usedDays;

      // ---- D. Upsert leave_balances for PL in current FY ----
      await client.query(
        `
        INSERT INTO leave_balances (employee_id, leave_type_id, year, entitled_days, used_days, balance_days, carried_over_days)
        VALUES ($1, 1, $2, $3, $4, $5, $6)
        ON CONFLICT (employee_id, leave_type_id, year)
        DO UPDATE SET
          entitled_days = EXCLUDED.entitled_days,
          used_days = EXCLUDED.used_days,
          balance_days = EXCLUDED.balance_days,
          carried_over_days = EXCLUDED.carried_over_days
      `,
        [empId, currentFY, entitledDays, usedDays, balanceDays, carryForward],
      );

      console.log(
        `Employee ${empId}: carry=${carryForward}, monthly=${monthlyCredits}, entitled=${entitledDays}, used=${usedDays}, balance=${balanceDays}`,
      );
    }

    await client.query("COMMIT");
    console.log("PL reconciliation completed successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Reconciliation failed:", err);
    throw err;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  reconcilePL().catch(console.error);
}

module.exports = { reconcilePL };
