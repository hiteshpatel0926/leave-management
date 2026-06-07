const pool = require("../config/db");
const bcrypt = require("bcryptjs");
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
    } = req.body;

    const existingUser = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [email],
    );

    if (existingUser.rows.length > 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ message: "Email already exists" });
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
     department, designation, joining_date, status, dob, gender, manager_id)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
  [userId, employeeCode, first_name, last_name, email,
   department, designation, joining_date, "ACTIVE", dob, gender, manager_id || null]
);
    const employeeId = employeeResult.rows[0].id;
    const currentYear = new Date().getFullYear();

    const leaveTypes = await pool.query(
      `SELECT * FROM leave_types WHERE active = true`,
    );

    // ✅ Gender‑based filtering using .includes()
    const filteredLeaveTypes = leaveTypes.rows.filter((leaveType) => {
      const nameLower = leaveType.name.toLowerCase();
      if (nameLower.includes("paternity")) return gender === "Male";
      if (nameLower.includes("maternity")) return gender === "Female";
      return true; // All other leave types (e.g., annual, sick, comp off)
    });

    for (const leaveType of filteredLeaveTypes) {
      await pool.query(
        `INSERT INTO leave_balances
         (employee_id, leave_type_id, year, entitled_days, used_days, balance_days)
         VALUES ($1,$2,$3,$4,$5,$6)`,
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

    await pool.query("COMMIT");
    res.status(201).json({
      message: "Employee created successfully",
      employee: employeeResult.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const searchEmployees = async (req, res) => {
  try {
    const search = req.query.search || "";
    const status = req.query.status || "ALL";

    let query = `
      SELECT e.*, 
             CONCAT(m.first_name, ' ', m.last_name) AS manager_name
      FROM employees e
      LEFT JOIN employees m ON e.manager_id = m.id
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
    res.status(500).json({ message: "Server Error" });
  }
};

const getEmployees = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, 
             CONCAT(m.first_name, ' ', m.last_name) AS manager_name
      FROM employees e
      LEFT JOIN employees m ON e.manager_id = m.id
      ORDER BY e.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getEmployeeById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT e.*, 
              CONCAT(m.first_name, ' ', m.last_name) AS manager_name
       FROM employees e
       LEFT JOIN employees m ON e.manager_id = m.id
       WHERE e.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
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
          gender = $8
        WHERE id = $9
        RETURNING *
        `,
      [first_name, last_name, department, designation, status, joining_date, dob, gender, id],
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
      `
        UPDATE employees
        SET status='INACTIVE'
        WHERE id=$1
        AND status='ACTIVE'
        RETURNING *
    `,
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


// Get list of potential managers (employees with role ADMIN or MANAGER)
const getPotentialManagers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.id, e.first_name, e.last_name, u.role
       FROM employees e
       JOIN users u ON e.user_id = u.id
       WHERE u.role IN ('ADMIN', 'MANAGER')
       ORDER BY e.first_name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update manager_id for an employee (admin only)
const updateEmployeeManager = async (req, res) => {
  const { employeeId } = req.params;
  const { managerId } = req.body; // can be null
  try {
    await pool.query(
      `UPDATE employees SET manager_id = $1 WHERE id = $2`,
      [managerId || null, employeeId]
    );
    res.json({ message: 'Manager updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Import employees from CSV
const importEmployees = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const employeesData = req.body.employees;
    if (!employeesData || !Array.isArray(employeesData) || employeesData.length === 0) {
      return res.status(400).json({ message: 'No valid employee data provided' });
    }

    const results = { success: [], errors: [], skipped: [] };
    const currentYear = new Date().getFullYear();

    for (const emp of employeesData) {
      try {
        // Validate required fields
        const required = ['first_name', 'last_name', 'email', 'department', 'designation', 'joining_date', 'dob', 'gender'];
        for (const field of required) {
          if (!emp[field]) throw new Error(`${field} is required`);
        }

        // Check if email already exists
        const existing = await client.query(`SELECT id FROM users WHERE email = $1`, [emp.email]);
        if (existing.rows.length > 0) {
          results.skipped.push({ email: emp.email, reason: 'Email already exists' });
          continue; // Skip this record, continue with next
        }

        // Generate employee code
        const lastEmp = await client.query(`SELECT employee_code FROM employees ORDER BY id DESC LIMIT 1`);
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
          [`${emp.first_name} ${emp.last_name}`, emp.email, hashedPassword, 'EMPLOYEE', emp.dob, emp.gender]
        );
        const userId = userRes.rows[0].id;

        // Insert employee
        const employeeRes = await client.query(
          `INSERT INTO employees
            (user_id, employee_code, first_name, last_name, email, department, designation, joining_date, status, dob, gender, manager_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
          [userId, employeeCode, emp.first_name, emp.last_name, emp.email, emp.department, emp.designation,
           emp.joining_date, 'ACTIVE', emp.dob, emp.gender, emp.manager_id || null]
        );
        const employeeId = employeeRes.rows[0].id;

        // Fetch leave types
        const leaveTypes = await client.query(`SELECT * FROM leave_types WHERE active = true`);
        const filteredLeaveTypes = leaveTypes.rows.filter(lt => {
          const nameLower = lt.name.toLowerCase();
          if (nameLower.includes('paternity')) return emp.gender === 'Male';
          if (nameLower.includes('maternity')) return emp.gender === 'Female';
          return true;
        });

        for (const lt of filteredLeaveTypes) {
          await client.query(
            `INSERT INTO leave_balances (employee_id, leave_type_id, year, entitled_days, used_days, balance_days)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [employeeId, lt.id, currentYear, lt.annual_entitlement, 0, lt.annual_entitlement]
          );
        }

        results.success.push({ email: emp.email, employeeCode });
      } catch (err) {
        results.errors.push({ email: emp.email, error: err.message });
      }
    }

    await client.query('COMMIT');
    res.status(200).json({
      message: `Import completed: ${results.success.length} added, ${results.skipped.length} skipped (duplicate), ${results.errors.length} failed`,
      results
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error during import' });
  } finally {
    client.release();
  }
};


// Export employees to CSV
const exportEmployees = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.id, e.employee_code, e.first_name, e.last_name, e.email,
             e.department, e.designation, e.joining_date, e.status,
             e.dob, e.gender, e.manager_id,
             CONCAT(m.first_name, ' ', m.last_name) AS manager_name
      FROM employees e
      LEFT JOIN employees m ON e.manager_id = m.id
      ORDER BY e.id
    `);

    const employees = result.rows;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');

    // Helper to format date as YYYY-MM-DD
    const formatDate = (dateValue) => {
      if (!dateValue) return '';
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    };

    // Write CSV header
    const headers = [
      'ID', 'Employee Code', 'First Name', 'Last Name', 'Email',
      'Department', 'Designation', 'Joining Date', 'Status',
      'Date of Birth', 'Gender', 'Manager ID', 'Manager Name'
    ];
    res.write(headers.join(',') + '\n');

    // Write rows
    employees.forEach(emp => {
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
        emp.manager_id || '',
        emp.manager_name || ''
      ].map(field => `"${String(field).replace(/"/g, '""')}"`);
      res.write(row.join(',') + '\n');
    });
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during export' });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  searchEmployees,
  getPotentialManagers,
  updateEmployeeManager,
  importEmployees,
  exportEmployees
};
