const pool = require('../config/db');

// Helper to get employee_id from user_id
const getEmployeeIdFromUserId = async (userId) => {
  const result = await pool.query(`SELECT id FROM employees WHERE user_id = $1`, [userId]);
  return result.rows[0]?.id;
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

const getCalendarEvents = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.userId;

    let query;
    let params = [];

    if (userRole === 'ADMIN') {
      // Admin sees all leaves (excluding cancelled)
      query = `
        SELECT 
          lr.id, 
          lr.start_date, 
          lr.end_date, 
          lr.total_days, 
          lr.status,
          lr.leave_type_id,
          lt.name AS leave_type,
          e.id AS employee_id,
          e.first_name,
          e.last_name,
          e.employee_code
        FROM leave_requests lr
        JOIN employees e ON lr.employee_id = e.id
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE lr.status != 'CANCELLED'
        ORDER BY lr.start_date ASC
      `;
    } else if (userRole === 'MANAGER') {
      const managerEmployeeId = await getEmployeeIdFromUserId(userId);
      if (!managerEmployeeId) {
        return res.status(404).json({ message: 'Employee record not found' });
      }
      // Get all descendant employee IDs (entire team hierarchy)
      const teamIds = await getAllDescendantEmployeeIds(managerEmployeeId);
      if (teamIds.length === 0) {
        return res.json([]);
      }
      query = `
        SELECT 
          lr.id, 
          lr.start_date, 
          lr.end_date, 
          lr.total_days, 
          lr.status,
          lr.leave_type_id,
          lt.name AS leave_type,
          e.id AS employee_id,
          e.first_name,
          e.last_name,
          e.employee_code
        FROM leave_requests lr
        JOIN employees e ON lr.employee_id = e.id
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE lr.status != 'CANCELLED'
          AND e.id = ANY($1::int[])
        ORDER BY lr.start_date ASC
      `;
      params = [teamIds];
    } else {
      // Regular employee sees only their own leaves
      const empId = await getEmployeeIdFromUserId(userId);
      if (!empId) {
        return res.status(404).json({ message: 'Employee record not found' });
      }
      query = `
        SELECT 
          lr.id, 
          lr.start_date, 
          lr.end_date, 
          lr.total_days, 
          lr.status,
          lr.leave_type_id,
          lt.name AS leave_type,
          e.id AS employee_id,
          e.first_name,
          e.last_name,
          e.employee_code
        FROM leave_requests lr
        JOIN employees e ON lr.employee_id = e.id
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE lr.employee_id = $1 AND lr.status != 'CANCELLED'
        ORDER BY lr.start_date ASC
      `;
      params = [empId];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCalendarEvents };