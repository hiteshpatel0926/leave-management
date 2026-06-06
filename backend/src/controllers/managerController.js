const pool = require('../config/db');

// Helper: get employee_id from user_id
const getEmployeeIdFromUserId = async (userId) => {
  const result = await pool.query(`SELECT id FROM employees WHERE user_id = $1`, [userId]);
  return result.rows[0]?.id;
};

// Get all direct reports (team)
const getTeam = async (req, res) => {
  try {
    const managerEmployeeId = await getEmployeeIdFromUserId(req.user.userId);
    if (!managerEmployeeId) return res.status(404).json({ message: 'Employee record not found' });

    const result = await pool.query(
      `SELECT id, first_name, last_name, email, department, designation, status
       FROM employees
       WHERE manager_id = $1
       ORDER BY first_name`,
      [managerEmployeeId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get team leave balances (grouped by employee and leave type)
const getTeamLeaveBalances = async (req, res) => {
  try {
    const managerEmployeeId = await getEmployeeIdFromUserId(req.user.userId);
    if (!managerEmployeeId) return res.status(404).json({ message: 'Employee record not found' });

    const result = await pool.query(
      `SELECT e.id, e.first_name, e.last_name,
              lb.leave_type_id, lt.name AS leave_type, lb.year,
              lb.entitled_days, lb.used_days, lb.balance_days
       FROM employees e
       JOIN leave_balances lb ON e.id = lb.employee_id
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE e.manager_id = $1
       ORDER BY e.first_name, lb.year DESC, lt.id`,
      [managerEmployeeId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get pending leave requests for team
const getTeamPendingLeaves = async (req, res) => {
  try {
    const managerEmployeeId = await getEmployeeIdFromUserId(req.user.userId);
    if (!managerEmployeeId) return res.status(404).json({ message: 'Employee record not found' });

    const result = await pool.query(
      `SELECT lr.*, e.first_name, e.last_name, lt.name AS leave_type
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE e.manager_id = $1 AND lr.status = 'PENDING'
       ORDER BY lr.applied_at ASC`,
      [managerEmployeeId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Manager approves or rejects a team member's leave
const updateTeamLeaveStatus = async (req, res) => {
  const { leaveId } = req.params;
  const { status } = req.body; // 'APPROVED' or 'REJECTED'
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const managerEmployeeId = await getEmployeeIdFromUserId(req.user.userId);
    if (!managerEmployeeId) return res.status(404).json({ message: 'Employee record not found' });

    // Verify the leave belongs to one of manager's direct reports
    const leaveCheck = await pool.query(
      `SELECT lr.id FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       WHERE lr.id = $1 AND e.manager_id = $2`,
      [leaveId, managerEmployeeId]
    );
    if (leaveCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized to update this leave' });
    }

    await pool.query(
      `UPDATE leave_requests SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3`,
      [status, req.user.userId, leaveId]
    );

    // Optional: send notification to employee (already exists in leaveController, but you can also call here)
    res.json({ message: `Leave ${status.toLowerCase()}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTeam,
  getTeamLeaveBalances,
  getTeamPendingLeaves,
  updateTeamLeaveStatus,
};