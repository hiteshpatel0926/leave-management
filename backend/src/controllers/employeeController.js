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
         department, designation, joining_date, status, dob, gender)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
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
      ],
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
      SELECT *
      FROM employees
      WHERE
      (
        employee_code ILIKE $1
        OR first_name ILIKE $1
        OR last_name ILIKE $1
        OR email ILIKE $1
        OR department ILIKE $1
        OR designation ILIKE $1
      )
    `;

    let params = [`%${search}%`];

    if (status !== "ALL") {
      query += `
        AND status = $2
      `;

      params.push(status);
    }

    query += `
      ORDER BY id
    `;

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
    const result = await pool.query("SELECT * FROM employees ORDER BY id");

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM employees WHERE id=$1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
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

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  searchEmployees,
};
