const pool = require("../config/db");
const {
  notifyLeaveApproved,
  notifyLeaveRejected,
} = require("../utils/notificationHelper");

// Helper: get employee_id from user_id
const getEmployeeIdFromUserId = async (userId) => {
  const result = await pool.query(
    `SELECT id FROM employees WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0]?.id;
};

// Helper: recursive CTE to get all descendant employee IDs under a manager
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
    [managerEmployeeId],
  );
  return result.rows.map(row => row.id);
};

// Get all direct reports (team) - unchanged (still only direct for simplicity)
const getTeam = async (req, res) => {
  try {
    const managerEmployeeId = await getEmployeeIdFromUserId(req.user.userId);
    if (!managerEmployeeId)
      return res.status(404).json({ message: "Employee record not found" });

    const result = await pool.query(
      `SELECT id, first_name, last_name, email, department, designation, status, profile_picture
       FROM employees
       WHERE manager_id = $1
       ORDER BY first_name`,
      [managerEmployeeId],
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get team leave balances - unchanged (only direct for simplicity)
const getTeamLeaveBalances = async (req, res) => {
  try {
    const managerEmployeeId = await getEmployeeIdFromUserId(req.user.userId);
    if (!managerEmployeeId)
      return res.status(404).json({ message: "Employee record not found" });

    const result = await pool.query(
      `SELECT e.id, e.first_name, e.last_name, e.employee_code, e.profile_picture,
              lb.leave_type_id, lt.name AS leave_type, lb.year,
              lb.entitled_days, lb.used_days, lb.balance_days
       FROM employees e
       JOIN leave_balances lb ON e.id = lb.employee_id
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE e.manager_id = $1
       ORDER BY e.first_name, lb.year DESC, lt.id`,
      [managerEmployeeId],
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get pending leave requests - ADMIN sees all, MANAGER sees entire hierarchy
const getTeamPendingLeaves = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.userId;

    if (userRole === "ADMIN") {
      // Admin: fetch all pending leaves with employee details
      const result = await pool.query(
        `SELECT lr.*, e.first_name, e.last_name, e.employee_code, e.profile_picture, lt.name AS leave_type
         FROM leave_requests lr
         JOIN employees e ON lr.employee_id = e.id
         JOIN leave_types lt ON lr.leave_type_id = lt.id
         WHERE lr.status = 'PENDING'
         ORDER BY lr.applied_at ASC`,
      );
      return res.json(result.rows);
    }

    // Manager: get all employees under their hierarchy
    const managerEmployeeId = await getEmployeeIdFromUserId(userId);
    if (!managerEmployeeId)
      return res.status(404).json({ message: "Employee record not found" });

    const teamIds = await getAllDescendantEmployeeIds(managerEmployeeId);
    if (teamIds.length === 0) {
      return res.json([]);
    }

    const result = await pool.query(
      `SELECT lr.*, e.first_name, e.last_name, e.employee_code, e.profile_picture, lt.name AS leave_type
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.status = 'PENDING' AND e.id = ANY($1::int[])
       ORDER BY lr.applied_at ASC`,
      [teamIds],
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Manager/Admin approves or rejects a leave request (with balance deduction)
const updateTeamLeaveStatus = async (req, res) => {
  const { leaveId } = req.params;
  const { status } = req.body; // 'APPROVED' or 'REJECTED'
  if (!["APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userRole = req.user.role;
    const userId = req.user.userId;

    let leave; // will hold the leave details
    let isAuthorized = false;

    if (userRole === "ADMIN") {
      // Admin: just fetch the leave (no manager check)
      const leaveCheck = await client.query(
        `SELECT lr.id, lr.employee_id, lr.total_days, lr.leave_type_id, 
                lt.code AS leave_type_code, lr.start_date, e.first_name, e.last_name
         FROM leave_requests lr
         JOIN employees e ON lr.employee_id = e.id
         JOIN leave_types lt ON lr.leave_type_id = lt.id
         WHERE lr.id = $1`,
        [leaveId],
      );
      if (leaveCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Leave request not found" });
      }
      leave = leaveCheck.rows[0];
      isAuthorized = true;
    } else {
      // Manager: verify leave belongs to any employee in the manager's hierarchy
      const managerEmployeeId = await getEmployeeIdFromUserId(userId);
      if (!managerEmployeeId) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Employee record not found" });
      }

      // Get all descendant employee IDs under this manager
      const teamIds = await getAllDescendantEmployeeIds(managerEmployeeId);
      if (teamIds.length === 0) {
        await client.query("ROLLBACK");
        return res.status(403).json({ message: "Not authorized – no team members" });
      }

      const leaveCheck = await client.query(
        `SELECT lr.id, lr.employee_id, lr.total_days, lr.leave_type_id, 
                lt.code AS leave_type_code, lr.start_date, e.first_name, e.last_name
         FROM leave_requests lr
         JOIN employees e ON lr.employee_id = e.id
         JOIN leave_types lt ON lr.leave_type_id = lt.id
         WHERE lr.id = $1 AND e.id = ANY($2::int[])`,
        [leaveId, teamIds],
      );
      if (leaveCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(403).json({ message: "Not authorized to update this leave" });
      }
      leave = leaveCheck.rows[0];
      isAuthorized = true;
    }

    if (!isAuthorized) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Unauthorized" });
    }

    // If approving, deduct balance (unless LOP)
    if (status === "APPROVED" && leave.leave_type_code !== "LOP") {
      const leaveYear = new Date(leave.start_date).getFullYear();
      const daysToDeduct = parseFloat(leave.total_days);
      if (isNaN(daysToDeduct) || daysToDeduct <= 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Invalid total days" });
      }

      const updateResult = await client.query(
        `UPDATE leave_balances
         SET used_days = used_days + $1,
             balance_days = balance_days - $1
         WHERE employee_id = $2
           AND leave_type_id = $3
           AND year = $4
         RETURNING *`,
        [daysToDeduct, leave.employee_id, leave.leave_type_id, leaveYear],
      );

      if (updateResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Leave balance not found for deduction" });
      }
    }

    // Update leave request status
    await client.query(
      `UPDATE leave_requests SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3`,
      [status, userId, leaveId],
    );

    await client.query("COMMIT");

    // Get actor name
    const actorRes = await pool.query(
      `SELECT first_name, last_name FROM employees WHERE user_id = $1`,
      [userId],
    );
    const actorName = actorRes.rows[0]
      ? `${actorRes.rows[0].first_name} ${actorRes.rows[0].last_name}`
      : "System";

    if (status === "APPROVED") {
      await notifyLeaveApproved(leave.employee_id, userId, actorName, leaveId);
    }
    if (status === "REJECTED") {
      await notifyLeaveRejected(leave.employee_id, userId, actorName, leaveId);
    }

    res.json({ message: `Leave ${status.toLowerCase()}` });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

module.exports = {
  getTeam,
  getTeamLeaveBalances,
  getTeamPendingLeaves,
  updateTeamLeaveStatus,
};