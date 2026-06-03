const pool = require("../config/db");
const currentYear = new Date().getFullYear();
const applyLeave = async (req, res) => {
  try {
    const employee = await pool.query(
      `SELECT id
    FROM employees
    WHERE user_id = $1
    `,
      [req.user.userId],
    );

    if (employee.rows.length === 0) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const employeeId = employee.rows[0].id;

    const { leave_type_id, start_date, end_date, reason } = req.body;

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (startDate > endDate) {
      return res.status(400).json({
        message: "End date cannot be before start date",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      return res.status(400).json({
        message: "Cannot apply leave for past dates",
      });
    }

    const leaveType = await pool.query(
      `
      SELECT *
      FROM leave_types
      WHERE id = $1
      `,
      [leave_type_id],
    );

    if (leaveType.rows.length === 0) {
      return res.status(404).json({
        message: "Invalid leave type",
      });
    }

    const totalDays =
      Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const balanceResult = await pool.query(
      `
  SELECT *
  FROM leave_balances
  WHERE employee_id = $1
  AND leave_type_id = $2
  AND year = $3
  `,
      [employeeId, leave_type_id, currentYear],
    );

    if (balanceResult.rows.length === 0) {
      return res.status(400).json({
        message: "Leave balance not found",
      });
    }

    const available = Number(balanceResult.rows[0].balance_days);

    if (totalDays > available) {
      return res.status(400).json({
        message: "Insufficient leave balance",
      });
    }

    const result = await pool.query(
      `
INSERT INTO leave_requests
(
  employee_id,
  leave_type_id,
  start_date,
  end_date,
  total_days,
  reason
)
VALUES ($1,$2,$3,$4,$5,$6)
RETURNING *
`,
      [employeeId, leave_type_id, start_date, end_date, totalDays, reason],
    );

    res.status(201).json({
      message: "Leave applied successfully",
      leave: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

const getMyLeaves = async (req, res) => {
  try {
    const employee = await pool.query(
      `
        SELECT id
        FROM employees
        WHERE user_id = $1
        `,
      [req.user.userId],
    );

    if (employee.rows.length === 0) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const employeeId = employee.rows[0].id;

    const result = await pool.query(
      `
        SELECT
          lr.*,
          lt.name AS leave_type
        FROM leave_requests lr
        JOIN leave_types lt
          ON lr.leave_type_id = lt.id
        WHERE employee_id = $1
        ORDER BY applied_at DESC
        `,
      [employeeId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

const getPendingLeaves = async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          lr.*,
          e.first_name,
          e.last_name,
          lt.name AS leave_type
        FROM leave_requests lr
        JOIN employees e
        ON e.id = lr.employee_id
        JOIN leave_types lt
        ON lt.id = lr.leave_type_id
        WHERE lr.status='PENDING'
        ORDER BY lr.applied_at
        `,
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

const approveLeave = async (req, res) => {
  try {
    await pool.query("BEGIN");

    const leaveId = req.params.id;

    const adminId = req.user.userId;

    const leave = await pool.query(
      `
        SELECT *
        FROM leave_requests
        WHERE id = $1
        `,
      [leaveId],
    );

    if (leave.rows.length === 0) {
      return res.status(404).json({
        message: "Leave not found",
      });
    }

    const leaveRequest = leave.rows[0];

    const currentYear = new Date().getFullYear();

    const balance = await pool.query(
      `
    SELECT *
    FROM leave_balances
    WHERE employee_id = $1
      AND leave_type_id = $2
      AND year = $3
    `,
      [leaveRequest.employee_id, leaveRequest.leave_type_id, currentYear],
    );

    if (balance.rows.length === 0) {
      return res.status(400).json({
        message: "Leave balance not found",
      });
    }

    const available = Number(balance.rows[0].balance_days);

    if (available < Number(leaveRequest.total_days)) {
      return res.status(400).json({
        message: "Insufficient balance for approval",
      });
    }

    if (leaveRequest.status !== "PENDING") {
      return res.status(400).json({
        message: `Leave already ${leaveRequest.status}`,
      });
    }

    await pool.query(
      `
      UPDATE leave_requests
      SET
      status='APPROVED',
      approved_by=$1,
      approved_at=NOW()
      WHERE id=$2
      `,
      [adminId, leaveId],
    );

    await pool.query(
      `
      UPDATE leave_balances
      SET
      used_days =
      used_days + $1,

      balance_days =
      balance_days - $1

      WHERE employee_id=$2
      AND leave_type_id=$3
      `,
      [
        leaveRequest.total_days,
        leaveRequest.employee_id,
        leaveRequest.leave_type_id,
      ],
    );

    await pool.query("COMMIT");
    res.json({
      message: "Leave Approved",
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

const rejectLeave = async (req, res) => {
  try {
    await pool.query(
      `
      UPDATE leave_requests
      SET status='REJECTED'
      WHERE id=$1
      `,
      [req.params.id],
    );

    res.json({
      message: "Leave Rejected",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getPendingLeaves,
  approveLeave,
  rejectLeave,
};
