const pool = require("../config/db");
const bcrypt = require("bcryptjs");

// ======================= LOCATION API ENDPOINTS =======================
const getCountries = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, code, phone_code FROM countries ORDER BY name",
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const getStates = async (req, res) => {
  const { countryId } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, name, code FROM states WHERE country_id = $1 ORDER BY name",
      [countryId],
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const getCities = async (req, res) => {
  const { stateId } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, name FROM cities WHERE state_id = $1 ORDER BY name",
      [stateId],
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================= EMPLOYEE CRUD =======================

// ------------------- Helper functions for PL accrual -------------------
function getFinancialYear(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 4 ? year : year - 1;
}

function getCreditForMonth(joinDate, year, month) {
  const firstOfMonth = new Date(year, month - 1, 1);
  const lastOfMonth = new Date(year, month, 0);
  const join = new Date(joinDate);
  if (join > lastOfMonth) return 0;
  if (join <= firstOfMonth) return 2;
  const joinDay = join.getDate();
  return joinDay < 15 ? 2 : 1;
}
// ---------------------------------------------------------------------

const createEmployee = async (req, res) => {
  try {
    await pool.query("BEGIN");

    const {
      first_name,
      last_name,
      email,
      password,
      department,
      designation,
      joining_date,
      dob,
      gender,
      manager_id,
      address,
      country_id,
      state_id,
      city_id,
      zip,
      phone_country_code,
      phone_number,
    } = req.body;

    const existingUser = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [email],
    );

    if (existingUser.rows.length > 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const lastEmployee = await pool.query(
      `SELECT employee_code FROM employees ORDER BY id DESC LIMIT 1`,
    );

    let employeeCode = "EMP001";
    if (lastEmployee.rows.length > 0) {
      const lastCode = lastEmployee.rows[0].employee_code;
      const number = parseInt(lastCode.replace("EMP", ""));
      employeeCode = `EMP${String(number + 1).padStart(3, "0")}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await pool.query(
      `INSERT INTO users (name, email, password, role, dob, gender)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [
        `${first_name} ${last_name}`,
        email,
        hashedPassword,
        "EMPLOYEE",
        dob,
        gender,
      ],
    );
    const userId = userResult.rows[0].id;

    const employeeResult = await pool.query(
      `INSERT INTO employees
        (user_id, employee_code, first_name, last_name, email,
         department, designation, joining_date, status, dob, gender, manager_id,
         address, country_id, state_id, city_id, zip, phone_country_code, phone_number)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
               $13,$14,$15,$16,$17,$18,$19) RETURNING *`,
      [
        userId,
        employeeCode,
        first_name,
        last_name,
        email,
        department,
        designation,
        joining_date,
        "ACTIVE",
        dob,
        gender,
        manager_id || null,
        address || null,
        country_id || null,
        state_id || null,
        city_id || null,
        zip || null,
        phone_country_code || null,
        phone_number || null,
      ],
    );
    const employeeId = employeeResult.rows[0].id;
    const currentYear = new Date().getFullYear();

    const leaveTypes = await pool.query(
      `SELECT * FROM leave_types WHERE active = true`,
    );
    const filteredLeaveTypes = leaveTypes.rows.filter((leaveType) => {
      const nameLower = leaveType.name.toLowerCase();
      if (nameLower.includes("paternity")) return gender === "Male";
      if (nameLower.includes("maternity")) return gender === "Female";
      return true;
    });

    // ----- MODIFIED SECTION: handle PL separately -----
    for (const leaveType of filteredLeaveTypes) {
      if (leaveType.code === "PL") {
        // Compute entitled days using monthly accrual logic
        const joinDate = new Date(joining_date);
        const today = new Date();
        const financialYear = getFinancialYear(today);
        const fyStart = new Date(financialYear, 3, 1); // April 1

        // Effective join date for the current financial year (cannot be before fyStart)
        const effectiveJoinDate = joinDate < fyStart ? fyStart : joinDate;

        // Calculate total monthly credits from April of financialYear up to today
        let monthlyCredits = 0;
        let year = financialYear;
        let month = 4; // April
        let currentMonth = today.getMonth() + 1;
        let currentYear = today.getFullYear();

        while (
          year < currentYear ||
          (year === currentYear && month <= currentMonth)
        ) {
          let calYear = year;
          if (month < 4) calYear = year + 1; // Jan-Mar belong to next calendar year
          const credit = getCreditForMonth(effectiveJoinDate, calYear, month);
          monthlyCredits += credit;
          month++;
          if (month > 12) {
            month = 1;
            year++;
          }
        }

        // New employee has no previous balance, so carryForward = 0
        const entitledDays = monthlyCredits;

        // Insert PL balance with financial year
        await pool.query(
          `INSERT INTO leave_balances
           (employee_id, leave_type_id, year, entitled_days, used_days, balance_days, carried_over_days)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            employeeId,
            leaveType.id,
            financialYear,
            entitledDays,
            0,
            entitledDays,
            0,
          ],
        );
      } else {
        // All other leave types keep the original logic (calendar year + annual_entitlement)
        await pool.query(
          `INSERT INTO leave_balances
           (employee_id, leave_type_id, year, entitled_days, used_days, balance_days)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            employeeId,
            leaveType.id,
            currentYear,
            leaveType.annual_entitlement,
            0,
            leaveType.annual_entitlement,
          ],
        );
      }
    }
    // -------------------------------------------------

    await pool.query("COMMIT");
    res.status(201).json({
      message: "Employee created successfully",
      employee: employeeResult.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

const searchEmployees = async (req, res) => {
  try {
    const search = req.query.search || "";
    const status = req.query.status || "ALL";

    let query = `
      SELECT e.*, 
             CONCAT(m.first_name, ' ', m.last_name) AS manager_name,
             c.name AS country_name,
             s.name AS state_name,
             ct.name AS city_name
      FROM employees e
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN countries c ON e.country_id = c.id
      LEFT JOIN states s ON e.state_id = s.id
      LEFT JOIN cities ct ON e.city_id = ct.id
      WHERE (
        e.employee_code ILIKE $1
        OR e.first_name ILIKE $1
        OR e.last_name ILIKE $1
        OR e.email ILIKE $1
        OR e.department ILIKE $1
        OR e.designation ILIKE $1
      )
    `;

    let params = [`%${search}%`];

    if (status !== "ALL") {
      query += ` AND e.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY e.id`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

const getEmployees = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, 
             CONCAT(m.first_name, ' ', m.last_name) AS manager_name,
             c.name AS country_name,
             s.name AS state_name,
             ct.name AS city_name
      FROM employees e
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN countries c ON e.country_id = c.id
      LEFT JOIN states s ON e.state_id = s.id
      LEFT JOIN cities ct ON e.city_id = ct.id
      ORDER BY e.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

const getEmployeeById = async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;
  const userId = req.user.userId;
  console.log("req.user:", req.user);

  try {
    let query = `
      SELECT e.*, 
             CONCAT(m.first_name, ' ', m.last_name) AS manager_name,
             c.name AS country_name,
             s.name AS state_name,
             ct.name AS city_name
      FROM employees e
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN countries c ON e.country_id = c.id
      LEFT JOIN states s ON e.state_id = s.id
      LEFT JOIN cities ct ON e.city_id = ct.id
      WHERE e.id = $1
    `;
    const params = [id];

    if (userRole === "MANAGER") {
      const managerEmp = await pool.query(
        `SELECT id FROM employees WHERE user_id = $1`,
        [userId],
      );
      if (managerEmp.rows.length === 0) {
        return res.status(403).json({
          message: "Not authorized",
        });
      }
      const managerEmployeeId = managerEmp.rows[0].id;
      query += ` AND (e.manager_id = $2 OR e.id = $2)`;
      params.push(managerEmployeeId);
    }

    const result = await pool.query(query, params);
    if (result.rows.length === 0)
      return res.status(404).json({
        message: "Employee not found",
      });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// NEW: getEmployeeDetails – returns nested profile, balances, leaves (used by frontend /employees/:id/details)
const getEmployeeDetails = async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;
  const userId = req.user.userId;

  try {
    // 1. Fetch employee basic info (including location names)
    let employeeQuery = `
      SELECT e.*, 
             CONCAT(m.first_name, ' ', m.last_name) AS manager_name,
             u.role,
             c.name AS country_name,
             s.name AS state_name,
             ct.name AS city_name
      FROM employees e
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN countries c ON e.country_id = c.id
      LEFT JOIN states s ON e.state_id = s.id
      LEFT JOIN cities ct ON e.city_id = ct.id
      WHERE e.id = $1
    `;
    const params = [id];

    if (userRole === "MANAGER") {
      const managerEmp = await pool.query(
        `SELECT id FROM employees WHERE user_id = $1`,
        [userId],
      );
      if (managerEmp.rows.length === 0) {
        return res.status(403).json({
          message: "Not authorized",
        });
      }
      const managerEmployeeId = managerEmp.rows[0].id;
      employeeQuery += ` AND (e.manager_id = $2 OR e.id = $2)`;
      params.push(managerEmployeeId);
    }

    const employeeResult = await pool.query(employeeQuery, params);
    if (employeeResult.rows.length === 0) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }
    const employee = employeeResult.rows[0];

    // 2. Fetch leave balances
    const balancesResult = await pool.query(
      `SELECT lt.code, lt.name, lb.entitled_days, lb.used_days, lb.balance_days
       FROM leave_balances lb
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE lb.employee_id = $1`,
      [id],
    );

    // 3. Fetch leave requests – corrected join
    const leavesResult = await pool.query(
      `SELECT lr.id, lt.name AS leave_type, lr.start_date, lr.end_date, lr.total_days, lr.status, lr.reason
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.employee_id = $1
       ORDER BY lr.start_date DESC`,
      [id],
    );

    // 4. Build response
    const response = {
      profile: employee,
      balances: balancesResult.rows,
      leaves: leavesResult.rows,
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      department,
      designation,
      status,
      joining_date,
      dob,
      gender,
      address,
      country_id,
      state_id,
      city_id,
      zip,
      phone_country_code,
      phone_number,
    } = req.body;

    const result = await pool.query(
      `
        UPDATE employees
        SET
          first_name = $1,
          last_name = $2,
          department = $3,
          designation = $4,
          status = $5,
          joining_date = $6,
          dob = $7,
          gender = $8,
          address = $9,
          country_id = $10,
          state_id = $11,
          city_id = $12,
          zip = $13,
          phone_country_code = $14,
          phone_number = $15
        WHERE id = $16
        RETURNING *
      `,
      [
        first_name,
        last_name,
        department,
        designation,
        status,
        joining_date,
        dob,
        gender,
        address || null,
        country_id || null,
        state_id || null,
        city_id || null,
        zip || null,
        phone_country_code || null,
        phone_number || null,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    res.json({
      message: "Employee updated successfully",
      employee: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE employees SET status='INACTIVE' WHERE id=$1 AND status='ACTIVE' RETURNING *`,
      [req.params.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }
    res.json({
      message: "Employee marked inactive",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

const getPotentialManagers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.id, e.first_name, e.last_name, u.role
       FROM employees e
       JOIN users u ON e.user_id = u.id
       WHERE u.role IN ('ADMIN', 'MANAGER')
       ORDER BY e.first_name`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const updateEmployeeManager = async (req, res) => {
  const { employeeId } = req.params;
  const { managerId } = req.body;
  try {
    await pool.query(`UPDATE employees SET manager_id = $1 WHERE id = $2`, [
      managerId || null,
      employeeId,
    ]);
    res.json({
      message: "Manager updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================= IMPORT / EXPORT =======================
const importEmployees = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const employeesData = req.body.employees;
    if (
      !employeesData ||
      !Array.isArray(employeesData) ||
      employeesData.length === 0
    ) {
      return res.status(400).json({
        message: "No valid employee data provided",
      });
    }

    const results = {
      success: [],
      errors: [],
      skipped: [],
    };
    const currentYear = new Date().getFullYear();

    for (const emp of employeesData) {
      try {
        // Validate required fields
        const required = [
          "first_name",
          "last_name",
          "email",
          "department",
          "designation",
          "joining_date",
          "dob",
          "gender",
        ];
        for (const field of required) {
          if (!emp[field]) throw new Error(`${field} is required`);
        }

        // Check if email already exists
        const existing = await client.query(
          `SELECT id FROM users WHERE email = $1`,
          [emp.email],
        );
        if (existing.rows.length > 0) {
          results.skipped.push({
            email: emp.email,
            reason: "Email already exists",
          });
          continue;
        }

        // Generate employee code
        const lastEmp = await client.query(
          `SELECT employee_code FROM employees ORDER BY id DESC LIMIT 1`,
        );
        let employeeCode = "EMP001";
        if (lastEmp.rows.length > 0) {
          const lastCode = lastEmp.rows[0].employee_code;
          const number = parseInt(lastCode.replace("EMP", ""));
          employeeCode = `EMP${String(number + 1).padStart(3, "0")}`;
        }

        // Use provided password or default
        const password = emp.password || "Temp@123";
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const userRes = await client.query(
          `INSERT INTO users (name, email, password, role, dob, gender)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
          [
            `${emp.first_name} ${emp.last_name}`,
            emp.email,
            hashedPassword,
            "EMPLOYEE",
            emp.dob,
            emp.gender,
          ],
        );
        const userId = userRes.rows[0].id;

        // ------------------------------------------------------------------
        // Resolve country, state, city names to IDs (optional fields)
        // ------------------------------------------------------------------
        let countryId = null;
        let stateId = null;
        let cityId = null;

        if (emp.country) {
          const countryRes = await client.query(
            `SELECT id FROM countries WHERE name ILIKE $1 OR code ILIKE $1`,
            [emp.country],
          );
          if (countryRes.rows.length > 0) countryId = countryRes.rows[0].id;
        }

        if (emp.state && countryId) {
          const stateRes = await client.query(
            `SELECT id FROM states WHERE name ILIKE $1 AND country_id = $2`,
            [emp.state, countryId],
          );
          if (stateRes.rows.length > 0) stateId = stateRes.rows[0].id;
        }

        if (emp.city && stateId) {
          const cityRes = await client.query(
            `SELECT id FROM cities WHERE name ILIKE $1 AND state_id = $2`,
            [emp.city, stateId],
          );
          if (cityRes.rows.length > 0) cityId = cityRes.rows[0].id;
        }

        // Insert employee
        const employeeRes = await client.query(
          `INSERT INTO employees
            (user_id, employee_code, first_name, last_name, email, department, designation, joining_date, status, dob, gender, manager_id,
             address, country_id, state_id, city_id, zip, phone_country_code, phone_number)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
                   $13,$14,$15,$16,$17,$18,$19) RETURNING id`,
          [
            userId,
            employeeCode,
            emp.first_name,
            emp.last_name,
            emp.email,
            emp.department,
            emp.designation,
            emp.joining_date,
            "ACTIVE",
            emp.dob,
            emp.gender,
            emp.manager_id || null,
            emp.address || null,
            countryId,
            stateId,
            cityId,
            emp.zip || null,
            emp.phone_country_code || null,
            emp.phone_number || null,
          ],
        );
        const employeeId = employeeRes.rows[0].id;

        // Fetch leave types
        const leaveTypes = await client.query(
          `SELECT * FROM leave_types WHERE active = true`,
        );
        const filteredLeaveTypes = leaveTypes.rows.filter((lt) => {
          const nameLower = lt.name.toLowerCase();
          if (nameLower.includes("paternity")) return emp.gender === "Male";
          if (nameLower.includes("maternity")) return emp.gender === "Female";
          return true;
        });

        for (const lt of filteredLeaveTypes) {
          await client.query(
            `INSERT INTO leave_balances (employee_id, leave_type_id, year, entitled_days, used_days, balance_days)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [
              employeeId,
              lt.id,
              currentYear,
              lt.annual_entitlement,
              0,
              lt.annual_entitlement,
            ],
          );
        }

        results.success.push({
          email: emp.email,
          employeeCode,
        });
      } catch (err) {
        results.errors.push({
          email: emp.email,
          error: err.message,
        });
      }
    }

    await client.query("COMMIT");
    res.status(200).json({
      message: `Import completed: ${results.success.length} added, ${results.skipped.length} skipped (duplicate), ${results.errors.length} failed`,
      results,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({
      message: "Server error during import",
    });
  } finally {
    client.release();
  }
};

const exportEmployees = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.id, e.employee_code, e.first_name, e.last_name, e.email,
             e.department, e.designation, e.joining_date, e.status,
             e.dob, e.gender, e.manager_id, e.address, e.zip,
             e.phone_country_code, e.phone_number,
             c.name AS country_name,
             s.name AS state_name,
             ct.name AS city_name,
             CONCAT(m.first_name, ' ', m.last_name) AS manager_name
      FROM employees e
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN countries c ON e.country_id = c.id
      LEFT JOIN states s ON e.state_id = s.id
      LEFT JOIN cities ct ON e.city_id = ct.id
      ORDER BY e.id
    `);

    const employees = result.rows;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=employees.csv");

    const formatDate = (dateValue) => {
      if (!dateValue) return "";
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0];
    };

    const headers = [
      "ID",
      "Employee Code",
      "First Name",
      "Last Name",
      "Email",
      "Department",
      "Designation",
      "Joining Date",
      "Status",
      "Date of Birth",
      "Gender",
      "Manager ID",
      "Manager Name",
      "Address",
      "City",
      "State",
      "Country",
      "Zip",
      "Phone Country Code",
      "Phone Number",
    ];
    res.write(headers.join(",") + "\n");

    employees.forEach((emp) => {
      const row = [
        emp.id,
        emp.employee_code,
        emp.first_name,
        emp.last_name,
        emp.email,
        emp.department,
        emp.designation,
        formatDate(emp.joining_date),
        emp.status,
        formatDate(emp.dob),
        emp.gender,
        emp.manager_id || "",
        emp.manager_name || "",
        emp.address || "",
        emp.city_name || "",
        emp.state_name || "",
        emp.country_name || "",
        emp.zip || "",
        emp.phone_country_code || "",
        emp.phone_number || "",
      ].map((field) => `"${String(field).replace(/"/g, '""')}"`);
      res.write(row.join(",") + "\n");
    });
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error during export",
    });
  }
};

const awardCompOff = async (req, res) => {
  const { employeeId, days, reason } = req.body;
  const awardedBy = req.user.userId;
  const currentYear = new Date().getFullYear();

  if (!employeeId || !days || days <= 0) {
    return res.status(400).json({
      message: "Invalid request",
    });
  }

  try {
    await pool.query("BEGIN");

    // Get the CO leave type ID
    const coTypeRes = await pool.query(
      "SELECT id FROM leave_types WHERE code = 'CO'",
    );
    if (coTypeRes.rows.length === 0) {
      return res.status(400).json({
        message: "Comp Off leave type not found",
      });
    }
    const coTypeId = coTypeRes.rows[0].id;

    // Update or insert leave_balances for current year
    const balanceRes = await pool.query(
      `INSERT INTO leave_balances (employee_id, leave_type_id, year, entitled_days, used_days, balance_days)
       VALUES ($1, $2, $3, $4, 0, $4)
       ON CONFLICT (employee_id, leave_type_id, year)
       DO UPDATE SET entitled_days = leave_balances.entitled_days + EXCLUDED.entitled_days,
                     balance_days = leave_balances.balance_days + EXCLUDED.entitled_days
       RETURNING *`,
      [employeeId, coTypeId, currentYear, days],
    );

    // Log the award
    await pool.query(
      `INSERT INTO comp_off_awards (employee_id, awarded_by, days, reason)
       VALUES ($1, $2, $3, $4)`,
      [employeeId, awardedBy, days, reason || "Awarded by manager/admin"],
    );

    await pool.query("COMMIT");

    res.json({
      message: `Awarded ${days} Comp Off day(s) successfully`,
      balance: balanceRes.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  getEmployeeDetails,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  searchEmployees,
  getPotentialManagers,
  updateEmployeeManager,
  importEmployees,
  exportEmployees,
  getCountries,
  getStates,
  getCities,
  awardCompOff,
};
