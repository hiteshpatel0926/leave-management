const pool = require("../config/db");

// Helper: get employee_id from user_id
const getEmployeeId = async (userId) => {
  if (!userId) return null;
  const result = await pool.query(`SELECT id FROM employees WHERE user_id = $1`, [userId]);
  return result.rows[0]?.id || null;
};

// Helper: get all descendant employee IDs under a manager (recursive)
const getAllDescendantEmployeeIds = async (managerEmployeeId) => {
  const result = await pool.query(
    `
    WITH RECURSIVE team_tree AS (
      SELECT id FROM employees WHERE manager_id = $1
      UNION ALL
      SELECT e.id
      FROM employees e
      INNER JOIN team_tree tt ON e.manager_id = tt.id
    )
    SELECT id FROM team_tree
    `,
    [managerEmployeeId]
  );
  return result.rows.map(row => row.id);
};


// Helper: get today's active session (check_out IS NULL)
const getActiveSession = async (employeeId) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const result = await pool.query(
    `SELECT * FROM attendance_records
     WHERE employee_id = $1 AND check_out IS NULL
       AND check_in BETWEEN $2 AND $3
     ORDER BY check_in DESC LIMIT 1`,
    [employeeId, start, end]
  );
  return result.rows[0];
};

// Helper: get today's total hours (sum of all sessions)
const getTodayTotalHours = async (employeeId) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const result = await pool.query(
    `SELECT COALESCE(SUM(total_hours), 0) as total
     FROM attendance_records
     WHERE employee_id = $1 AND check_in BETWEEN $2 AND $3
       AND (is_manual = false OR (is_manual = true AND approval_status = 'APPROVED'))`,
    [employeeId, start, end]
  );
  return parseFloat(result.rows[0].total) || 0;
};

// Helper: calculate hours between two dates
const calculateHours = (checkIn, checkOut) => {
  const diffMs = new Date(checkOut) - new Date(checkIn);
  return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
};

// 1. Check-in (starts a new session)
const checkIn = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const employeeId = await getEmployeeId(userId);
    if (!employeeId)
      return res.status(404).json({ message: "Employee record not found" });

    // Check if already active session (no check-out)
    const active = await getActiveSession(employeeId);
    if (active) {
      return res
        .status(400)
        .json({ message: "You have already checked in without checking out." });
    }

    const now = new Date();
    const result = await pool.query(
      `INSERT INTO attendance_records (employee_id, check_in)
       VALUES ($1, $2) RETURNING *`,
      [employeeId, now],
    );

    res
      .status(201)
      .json({ message: "Check-in successful", record: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 2. Check-out (ends current active session)
const checkOut = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const employeeId = await getEmployeeId(userId);
    if (!employeeId)
      return res.status(404).json({ message: "Employee record not found" });

    const active = await getActiveSession(employeeId);
    if (!active) {
      return res
        .status(400)
        .json({ message: "No active check-in session found." });
    }

    const now = new Date();
    const totalHours = calculateHours(active.check_in, now);
    const result = await pool.query(
      `UPDATE attendance_records
       SET check_out = $1, total_hours = $2
       WHERE id = $3 RETURNING *`,
      [now, totalHours, active.id],
    );

    res.json({ message: "Check-out successful", record: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 3. Get current session and today's total (for live timer)
const getTodayStatus = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const employeeId = await getEmployeeId(userId);
    if (!employeeId)
      return res.status(404).json({ message: "Employee record not found" });

    const activeSession = await getActiveSession(employeeId);
    const totalHoursToday = await getTodayTotalHours(employeeId);

    res.json({
      activeSession: activeSession || null,
      totalHoursToday,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 4. Get attendance records for calendar (grouped by day with derived status)
const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const employeeId = await getEmployeeId(userId);
    if (!employeeId)
      return res.status(404).json({ message: "Employee record not found" });

    const { year, month } = req.query;
    let start, end;
    if (year && month) {
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 0);
    } else {
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Get all sessions within month
    const sessions = await pool.query(
      `SELECT check_in, total_hours
   FROM attendance_records
   WHERE employee_id = $1 AND check_in >= $2 AND check_in <= $3
     AND (is_manual = false OR (is_manual = true AND approval_status = 'APPROVED'))
   ORDER BY check_in`,
      [employeeId, start, end],
    );

    // Group by day and sum total_hours
    const dailyMap = new Map();
    sessions.rows.forEach((session) => {
      const date = session.check_in.toISOString().split("T")[0];
      const hours = parseFloat(session.total_hours) || 0;
      dailyMap.set(date, (dailyMap.get(date) || 0) + hours);
    });

    // Format for frontend calendar
    const events = [];
    for (const [date, totalHours] of dailyMap.entries()) {
      let status = "ABSENT";
      let color = "#ef4444"; // red
      if (totalHours >= 8) {
        status = "PRESENT";
        color = "#10b981"; // green
      } else if (totalHours >= 4) {
        status = "HALF_DAY";
        color = "#f59e0b"; // amber
      } else if (totalHours > 0 && totalHours < 4) {
        status = "ABSENT";
        color = "#ef4444";
      }

      events.push({
        id: date,
        title:
          status === "PRESENT"
            ? "✅ Present"
            : status === "HALF_DAY"
              ? "⏳ Half Day"
              : "❌ Absent",
        start: date,
        allDay: true,
        backgroundColor: color,
        borderColor: "#ffffff",
        extendedProps: { totalHours, status },
      });
    }

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 5. Request manual attendance (employee)
const requestAttendance = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const employeeId = await getEmployeeId(userId);
    if (!employeeId)
      return res.status(404).json({ message: "Employee record not found" });

    const { date, check_in, check_out, reason } = req.body;
    if (!date || !check_in || !check_out) {
      return res
        .status(400)
        .json({ message: "Date, check-in, and check-out times are required." });
    }

    // Combine date with check_in/out times
    const checkInDateTime = new Date(`${date}T${check_in}:00`);
    const checkOutDateTime = new Date(`${date}T${check_out}:00`);

    if (checkInDateTime >= checkOutDateTime) {
      return res
        .status(400)
        .json({ message: "Check-out time must be after check-in time." });
    }

    // Calculate total hours
    const totalHours = calculateHours(checkInDateTime, checkOutDateTime);

    // Insert as a manual entry with status PENDING
 const result = await pool.query(
  `INSERT INTO attendance_records
   (employee_id, check_in, check_out, total_hours, is_manual, approval_status, requested_by, reason)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
   RETURNING *`,
  [employeeId, checkInDateTime, checkOutDateTime, totalHours, true, 'PENDING', employeeId, reason || null]
);

    res
      .status(201)
      .json({
        message: "Manual attendance request submitted.",
        record: result.rows[0],
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 6. Get pending attendance requests (for managers/admins)
const getAttendanceRequests = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const userRole = req.user.role;
    if (!['ADMIN', 'MANAGER'].includes(userRole)) {
      return res.status(403).json({ message: "Access denied." });
    }

    let query, params;
    if (userRole === 'ADMIN') {
      query = `
        SELECT ar.*, e.first_name, e.last_name, e.employee_code
        FROM attendance_records ar
        JOIN employees e ON ar.employee_id = e.id
        WHERE ar.is_manual = true AND ar.approval_status = 'PENDING'
        ORDER BY ar.created_at ASC
      `;
      params = [];
    } else {
      // Manager: get all descendant employee IDs under this manager
      const managerEmployeeId = await getEmployeeId(userId);
      if (!managerEmployeeId) {
        return res.status(404).json({ message: "Manager employee record not found" });
      }
      const teamIds = await getAllDescendantEmployeeIds(managerEmployeeId);
      if (teamIds.length === 0) {
        return res.json([]);
      }
      query = `
        SELECT ar.*, e.first_name, e.last_name, e.employee_code
        FROM attendance_records ar
        JOIN employees e ON ar.employee_id = e.id
        WHERE ar.is_manual = true AND ar.approval_status = 'PENDING'
          AND ar.employee_id = ANY($1::int[])
        ORDER BY ar.created_at ASC
      `;
      params = [teamIds];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get attendance requests error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 7. Approve manual attendance request
const approveAttendanceRequest = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const requestId = req.params.id;
    const approverUserId = req.user.userId;
    const approverEmployeeId = await getEmployeeId(approverUserId);
    if (!approverEmployeeId) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "Approver employee record not found" });
    }

    // Fetch request
    const request = await client.query(
      `SELECT * FROM attendance_records WHERE id = $1 AND is_manual = true AND approval_status = 'PENDING'`,
      [requestId],
    );
    if (request.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "Request not found or already processed" });
    }

    // Update approval_status to APPROVED, set approved_by, approved_at
    const result = await client.query(
      `UPDATE attendance_records
       SET approval_status = 'APPROVED', approved_by = $1, approved_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [approverEmployeeId, requestId],
    );

    // Notify the employee (optional)
    // You can call a notification helper here

    await client.query("COMMIT");
    res.json({
      message: "Request approved successfully",
      record: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

// 8. Reject manual attendance request
const rejectAttendanceRequest = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const requestId = req.params.id;

    const request = await client.query(
      `SELECT * FROM attendance_records WHERE id = $1 AND is_manual = true AND approval_status = 'PENDING'`,
      [requestId],
    );
    if (request.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "Request not found or already processed" });
    }

    await client.query(
      `UPDATE attendance_records SET approval_status = 'REJECTED' WHERE id = $1`,
      [requestId],
    );

    // Notify the employee

    await client.query("COMMIT");
    res.json({ message: "Request rejected" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

// 9. Get employee's own manual attendance requests
const getMyManualRequests = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const employeeId = await getEmployeeId(userId);
    if (!employeeId) return res.status(404).json({ message: "Employee not found" });

    const { status } = req.query; // optional filter: PENDING, APPROVED, REJECTED, ALL
    let query = `
      SELECT id, check_in, check_out, total_hours, reason, approval_status, created_at
      FROM attendance_records
      WHERE requested_by = $1 AND is_manual = true
    `;
    const params = [employeeId];

    if (status && status !== 'ALL') {
      query += ` AND approval_status = $2`;
      params.push(status);
    }
    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyAttendance,
  requestAttendance,
  getAttendanceRequests,
  approveAttendanceRequest,
  rejectAttendanceRequest,
  getMyManualRequests,
};
