const pool = require("../config/db");

async function createNotification(
  userId,
  type,
  title,
  message,
  relatedId = null,
) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, type, title, message, relatedId],
    );
    return true;
  } catch (error) {
    console.error("Notification Error:", error);
    return false;
  }
}

async function getManagerUsers(employeeId) {
  const managers = [];
  let currentEmployee = employeeId;
  while (currentEmployee) {
    const result = await pool.query(
      `SELECT manager_id FROM employees WHERE id = $1`,
      [currentEmployee],
    );
    if (!result.rows.length) break;
    const managerId = result.rows[0].manager_id;
    if (!managerId) break;
    const manager = await pool.query(
      `SELECT user_id FROM employees WHERE id = $1`,
      [managerId],
    );
    if (manager.rows.length) managers.push(manager.rows[0].user_id);
    currentEmployee = managerId;
  }
  return [...new Set(managers)];
}

async function getAdminUsers() {
  const result = await pool.query(`SELECT id FROM users WHERE role = 'ADMIN'`);
  return result.rows.map((x) => x.id);
}

// Leave submitted (works)
async function notifyLeaveSubmitted(employeeId, employeeName, leaveId) {
  const managers = await getManagerUsers(employeeId);
  const admins = await getAdminUsers();
  const recipients = [...new Set([...managers, ...admins])];
  for (const userId of recipients) {
    await createNotification(
      userId,
      "LEAVE_SUBMITTED",
      "New Leave Request",
      `${employeeName} submitted a leave request`,
      leaveId,
    );
  }
}

// Leave cancelled (works)
async function notifyLeaveCancelled(employeeId, employeeName, leaveId) {
  const managers = await getManagerUsers(employeeId);
  const admins = await getAdminUsers();
  const recipients = [...new Set([...managers, ...admins])];
  for (const userId of recipients) {
    await createNotification(
      userId,
      "LEAVE_CANCELLED",
      "Leave Cancelled",
      `${employeeName} cancelled a leave request`,
      leaveId,
    );
  }
}

// Leave approved – fixed signature (no req)
async function notifyLeaveApproved(
  employeeId,
  actorUserId,
  actorName,
  leaveId,
) {
  const employee = await pool.query(
    `SELECT user_id FROM employees WHERE id = $1`,
    [employeeId],
  );
  const employeeUserId = employee.rows[0]?.user_id;
  if (!employeeUserId) {
    console.error("Employee user_id not found for employeeId:", employeeId);
    return;
  }
  const managers = await getManagerUsers(employeeId);
  const admins = await getAdminUsers();
  const recipients = new Set([employeeUserId, ...managers, ...admins]);
  recipients.delete(actorUserId);
  for (const userId of recipients) {
    await createNotification(
      userId,
      "LEAVE_APPROVED",
      "Leave Approved",
      `Leave approved by ${actorName}`,
      leaveId,
    );
  }
}

// Leave rejected – fixed signature (no req)
async function notifyLeaveRejected(
  employeeId,
  actorUserId,
  actorName,
  leaveId,
) {
  const employee = await pool.query(
    `SELECT user_id FROM employees WHERE id = $1`,
    [employeeId],
  );
  const employeeUserId = employee.rows[0]?.user_id;
  if (!employeeUserId) {
    console.error("Employee user_id not found for employeeId:", employeeId);
    return;
  }
  const managers = await getManagerUsers(employeeId);
  const admins = await getAdminUsers();
  const recipients = new Set([employeeUserId, ...managers, ...admins]);
  recipients.delete(actorUserId);
  for (const userId of recipients) {
    await createNotification(
      userId,
      "LEAVE_REJECTED",
      "Leave Rejected",
      `Leave rejected by ${actorName}`,
      leaveId,
    );
  }
}

module.exports = {
  notifyLeaveSubmitted,
  notifyLeaveApproved,
  notifyLeaveRejected,
  notifyLeaveCancelled,
};
