const pool = require('../config/db');

const carryForwardLeaves = async (currentYear, nextYear) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const leaveTypes = await client.query(
      `SELECT id, max_carry_forward FROM leave_types WHERE carry_forward_allowed = true`
    );

    for (const lt of leaveTypes.rows) {
      // Get employees with positive balance in current year
      const balances = await client.query(
        `SELECT employee_id, balance_days 
         FROM leave_balances 
         WHERE leave_type_id = $1 AND year = $2 AND balance_days > 0`,
        [lt.id, currentYear]
      );

      for (const bal of balances.rows) {
        // Check if we already carried forward for this employee for next year
        const existingCarry = await client.query(
          `SELECT carried_over_days FROM leave_balances 
           WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3 AND carried_over_days > 0`,
          [bal.employee_id, lt.id, nextYear]
        );
        if (existingCarry.rows.length > 0) {
          console.log(`Skipping employee ${bal.employee_id} for leave_type ${lt.id} – already carried forward`);
          continue;
        }

        let carryDays = bal.balance_days;
        if (lt.max_carry_forward > 0 && carryDays > lt.max_carry_forward) {
          carryDays = lt.max_carry_forward;
        }
        if (carryDays <= 0) continue;

        const nextYearBalance = await client.query(
          `SELECT id FROM leave_balances 
           WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3`,
          [bal.employee_id, lt.id, nextYear]
        );

        if (nextYearBalance.rows.length === 0) {
          await client.query(
            `INSERT INTO leave_balances 
             (employee_id, leave_type_id, year, entitled_days, used_days, balance_days, carried_over_days)
             VALUES ($1, $2, $3, $4, 0, $4, $4)`,
            [bal.employee_id, lt.id, nextYear, carryDays]
          );
        } else {
          await client.query(
            `UPDATE leave_balances 
             SET entitled_days = entitled_days + $1,
                 balance_days = balance_days + $1,
                 carried_over_days = carried_over_days + $1
             WHERE id = $2`,
            [carryDays, nextYearBalance.rows[0].id]
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log(`Carry-forward completed from ${currentYear} to ${nextYear}`);
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Carry-forward error:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { carryForwardLeaves };