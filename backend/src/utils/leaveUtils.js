async function initializePLBalanceForEmployee(employeeId, joiningDate, client) {
  const today = new Date();
  const currentFY = getFinancialYear(today);
  const fyStart = getFinancialYearStart(currentFY);

  // If joining date is before the start of current FY, treat as from FY start
  const effectiveJoinDate = new Date(Math.max(joiningDate, fyStart));

  // Compute total monthly credits from the month of joining up to today
  let totalCredits = 0;
  let year = currentFY;
  let month = 4; // April
  let currentMonth = today.getMonth() + 1;
  let currentYear = today.getFullYear();

  while (year < currentYear || (year === currentYear && month <= currentMonth)) {
    let calYear = year;
    if (month < 4) calYear = year + 1;
    const credit = getCreditForMonth(effectiveJoinDate, calYear, month);
    totalCredits += credit;
    month++;
    if (month > 12) { month = 1; year++; }
  }

  // Get carry‑forward from previous FY (if any)
  const prevFY = currentFY - 1;
  const prevBalanceRes = await client.query(
    `SELECT balance_days FROM leave_balances WHERE employee_id = $1 AND leave_type_id = 1 AND year = $2`,
    [employeeId, prevFY]
  );
  const carryForward = Math.min(prevBalanceRes.rows[0]?.balance_days || 0, 6);
  const entitledDays = carryForward + totalCredits;

  // Get used days from approved leaves (only if any exist, usually none for new employee)
  const usedRes = await client.query(`
    SELECT COALESCE(SUM(total_days), 0) AS used
    FROM leave_requests
    WHERE employee_id = $1 AND leave_type_id = 1 AND status = 'APPROVED'
      AND start_date >= $2 AND end_date <= $3
  `, [employeeId, fyStart, new Date(currentFY + 1, 2, 31)]);
  const usedDays = parseFloat(usedRes.rows[0].used);
  const balanceDays = entitledDays - usedDays;

  // Upsert the leave_balances record
  await client.query(`
    INSERT INTO leave_balances (employee_id, leave_type_id, year, entitled_days, used_days, balance_days, carried_over_days)
    VALUES ($1, 1, $2, $3, $4, $5, $6)
    ON CONFLICT (employee_id, leave_type_id, year)
    DO UPDATE SET
      entitled_days = EXCLUDED.entitled_days,
      used_days = EXCLUDED.used_days,
      balance_days = EXCLUDED.balance_days,
      carried_over_days = EXCLUDED.carried_over_days
  `, [employeeId, currentFY, entitledDays, usedDays, balanceDays, carryForward]);
}