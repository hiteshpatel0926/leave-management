// monthlyPLAccrual.js - Permanent Catch-Up & Idempotent Logic
require('dotenv').config();
const pool = require('../config/db');

// Helper to get financial year for a given date (April start)
function getFinancialYear(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 4 ? year : year - 1;
}

// Helper to calculate credit based on joining date
function getCreditForMonth(joinDate, targetYear, targetMonth) {
  const firstOfMonth = new Date(targetYear, targetMonth - 1, 1);
  const lastOfMonth = new Date(targetYear, targetMonth, 0);
  const join = new Date(joinDate);
  
  // 1. If they haven't joined by the end of this month, they get 0
  if (join > lastOfMonth) return 0;
  
  // 2. If they joined on or before the 1st of this month, they get full 2 days
  if (join <= firstOfMonth) return 2;
  
  // 3. If they joined mid-month: 1-15 gets 2 days, 16+ gets 1 day
  const joinDay = join.getDate();
  return joinDay <= 15 ? 2 : 1;
}

async function monthlyPLAccrual() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const financialYear = getFinancialYear(today);

    console.log(`[DEBUG] Running Accrual check for Today: ${today.toISOString().split('T')[0]}`);
    console.log(`[DEBUG] Current Financial Year: ${financialYear}`);

    // Ensure audit table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS leave_balance_audit (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20),
        year INT,
        month INT,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Determine which months we *should* have processed by now
    // Financial months: 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3
    let currentFYMonthIndex = currentMonth >= 4 ? currentMonth : currentMonth + 12;
    
    // Get all already applied months from audit table for this FY
    const auditRes = await client.query(`
      SELECT month FROM leave_balance_audit 
      WHERE type = 'monthly_pl' AND year = $1
    `, [financialYear]);
    const appliedMonths = new Set(auditRes.rows.map(r => r.month));

    let totalUpdated = 0;

    // Loop through all months of the financial year up to the current month
    for (let fyMonth = 4; fyMonth <= currentFYMonthIndex; fyMonth++) {
      const actualMonth = fyMonth > 12 ? fyMonth - 12 : fyMonth;
      const actualYear = fyMonth > 12 ? financialYear + 1 : financialYear;

      // If this month was already processed, skip it
      if (appliedMonths.has(actualMonth)) {
        continue;
      }

      console.log(`\n[DEBUG] ⏳ Processing missing accrual for: ${actualYear}-${actualMonth.toString().padStart(2, '0')}`);

      // Get all active employees
      const employees = await client.query(`
        SELECT id, joining_date FROM employees WHERE status ILIKE 'active'
      `);

      let monthUpdatedCount = 0;

      for (const emp of employees.rows) {
        const credit = getCreditForMonth(emp.joining_date, actualYear, actualMonth);
        if (credit === 0) continue;

        const balanceRes = await client.query(`
          SELECT id, entitled_days, balance_days
          FROM leave_balances
          WHERE employee_id = $1 AND leave_type_id = 1 AND year = $2
        `, [emp.id, financialYear]);

        if (balanceRes.rows.length === 0) {
          // No record yet – create one. (e.g., new employee or carry-forward hasn't run yet)
          await client.query(`
            INSERT INTO leave_balances (employee_id, leave_type_id, year, entitled_days, used_days, balance_days, carried_over_days)
            VALUES ($1, 1, $2, $3, 0, $3, 0)
          `, [emp.id, financialYear, credit]);
        } else {
          // Record exists (either from previous month, or from carry-forward script)
          const row = balanceRes.rows[0];
          const newEntitled = parseFloat(row.entitled_days) + credit;
          const newBalance = parseFloat(row.balance_days) + credit;
          
          await client.query(`
            UPDATE leave_balances
            SET entitled_days = $1, balance_days = $2
            WHERE id = $3
          `, [newEntitled, newBalance, row.id]);
        }
        monthUpdatedCount++;
      }

      // Record that this specific month is now applied
      await client.query(`
        INSERT INTO leave_balance_audit (type, year, month) VALUES ('monthly_pl', $1, $2)
      `, [financialYear, actualMonth]);
      
      console.log(`[DEBUG] ✅ Applied ${actualMonth}/${actualYear}. Updated ${monthUpdatedCount} employees.`);
      totalUpdated += monthUpdatedCount;
    }

    await client.query('COMMIT');
    if (totalUpdated === 0) {
      console.log(`\n✅ All accruals up to ${currentMonth}/${currentYear} are already applied. No action needed.`);
    } else {
      console.log(`\n✅ Monthly PL catch-up complete. Total employee records updated: ${totalUpdated}`);
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Monthly accrual failed:', err);
  } finally {
    client.release();
  }
}

// Run if called directly (for manual testing)
if (require.main === module) {
  monthlyPLAccrual().catch(console.error);
}

module.exports = { monthlyPLAccrual };