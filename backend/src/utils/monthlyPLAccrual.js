// monthlyPLAccrual.js
require('dotenv').config();
const pool = require('../config/db');

// Reuse the same helper as in reconcilePL
function getCreditForMonth(joinDate, year, month) {
  const firstOfMonth = new Date(year, month - 1, 1);
  const lastOfMonth = new Date(year, month, 0);
  const join = new Date(joinDate);
  if (join > lastOfMonth) return 0;
  if (join <= firstOfMonth) return 2;
  const joinDay = join.getDate();
  return joinDay < 15 ? 2 : 1;
}

// Helper to get financial year for a given date (April start)
function getFinancialYear(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 4 ? year : year - 1;
}

async function monthlyPLAccrual() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const financialYear = getFinancialYear(today);

    console.log(`[DEBUG] today = ${today}, currentMonth = ${currentMonth}, currentYear = ${currentYear}, financialYear = ${financialYear}`);

    // Safety: only run on the 1st of the month (or allow manual override)
    if (today.getDate() !== 1) {
      console.log('Not the first day of the month. Skipping PL accrual.');
      return;
    }

    // Prevent double-run for the same month
    const auditRes = await client.query(`
      SELECT 1 FROM leave_balance_audit 
      WHERE type = 'monthly_pl' AND year = $1 AND month = $2
    `, [financialYear, currentMonth]);
    if (auditRes.rows.length > 0) {
      console.log(`PL accrual already applied for ${currentYear}-${currentMonth}. Skipping.`);
      return;
    }

    // Get all active employees
    const employees = await client.query(`
      SELECT id, joining_date FROM employees WHERE status ILIKE 'active'
    `);
    console.log(`[DEBUG] Found ${employees.rows.length} active employees.`);

    let updatedCount = 0;

    for (const emp of employees.rows) {
      const credit = getCreditForMonth(emp.joining_date, currentYear, currentMonth);
      console.log(`[DEBUG] Employee ${emp.id}, joining ${emp.joining_date}, credit = ${credit}`);
      if (credit === 0) continue;

      // Get current PL balance for this financial year
      const balanceRes = await client.query(`
        SELECT id, entitled_days, used_days, balance_days
        FROM leave_balances
        WHERE employee_id = $1 AND leave_type_id = 1 AND year = $2
      `, [emp.id, financialYear]);

      if (balanceRes.rows.length === 0) {
        // No record yet – create one
        await client.query(`
          INSERT INTO leave_balances (employee_id, leave_type_id, year, entitled_days, used_days, balance_days, carried_over_days)
          VALUES ($1, 1, $2, $3, 0, $3, 0)
        `, [emp.id, financialYear, credit]);
        console.log(`[DEBUG] Created new balance for employee ${emp.id} with ${credit} days.`);
      } else {
        const row = balanceRes.rows[0];
        const newEntitled = parseFloat(row.entitled_days) + credit;
        const newBalance = parseFloat(row.balance_days) + credit;
        await client.query(`
          UPDATE leave_balances
          SET entitled_days = $1, balance_days = $2
          WHERE id = $3
        `, [newEntitled, newBalance, row.id]);
        console.log(`[DEBUG] Updated employee ${emp.id}: entitled ${row.entitled_days} → ${newEntitled}, balance ${row.balance_days} → ${newBalance}`);
        updatedCount++;
      }
    }

    // Create audit table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS leave_balance_audit (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20),
        year INT,
        month INT,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);
    // Record that we applied the accrual for this month
    await client.query(`
      INSERT INTO leave_balance_audit (type, year, month) VALUES ('monthly_pl', $1, $2)
    `, [financialYear, currentMonth]);

    await client.query('COMMIT');
    console.log(`Monthly PL accrual applied for ${currentYear}-${currentMonth}. Updated ${updatedCount} employees.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Monthly accrual failed:', err);
  } finally {
    client.release();
  }
}

// Run if called directly (for manual testing)
if (require.main === module) {
  monthlyPLAccrual().catch(console.error);
}

module.exports = { monthlyPLAccrual };