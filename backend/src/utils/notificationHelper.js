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

// Leave submitted
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

// Leave cancelled
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

// Leave approved – with employee name for managers/admins
async function notifyLeaveApproved(
  employeeId,
  actorUserId,
  actorName,
  leaveId,
) {
  const employee = await pool.query(
    `SELECT user_id, first_name, last_name FROM employees WHERE id = $1`,
    [employeeId],
  );
  const employeeUserId = employee.rows[0]?.user_id;
  const employeeName = `${employee.rows[0]?.first_name} ${employee.rows[0]?.last_name}`;
  if (!employeeUserId) {
    console.error("Employee user_id not found for employeeId:", employeeId);
    return;
  }
  const managers = await getManagerUsers(employeeId);
  const admins = await getAdminUsers();
  const recipients = new Set([employeeUserId, ...managers, ...admins]);
  recipients.delete(actorUserId);
  for (const userId of recipients) {
    let message;
    if (userId === employeeUserId) {
      message = `✅ Your leave request has been approved by ${actorName}.`;
    } else {
      message = `✅ ${employeeName}'s leave request has been approved by ${actorName}.`;
    }
    await createNotification(
      userId,
      "LEAVE_APPROVED",
      "Leave Approved",
      message,
      leaveId,
    );
  }
}

// Leave rejected – with employee name for managers/admins
async function notifyLeaveRejected(
  employeeId,
  actorUserId,
  actorName,
  leaveId,
) {
  const employee = await pool.query(
    `SELECT user_id, first_name, last_name FROM employees WHERE id = $1`,
    [employeeId],
  );
  const employeeUserId = employee.rows[0]?.user_id;
  const employeeName = `${employee.rows[0]?.first_name} ${employee.rows[0]?.last_name}`;
  if (!employeeUserId) {
    console.error("Employee user_id not found for employeeId:", employeeId);
    return;
  }
  const managers = await getManagerUsers(employeeId);
  const admins = await getAdminUsers();
  const recipients = new Set([employeeUserId, ...managers, ...admins]);
  recipients.delete(actorUserId);
  for (const userId of recipients) {
    let message;
    if (userId === employeeUserId) {
      message = `❌ Your leave request has been rejected by ${actorName}.`;
    } else {
      message = `❌ ${employeeName}'s leave request has been rejected by ${actorName}.`;
    }
    await createNotification(
      userId,
      "LEAVE_REJECTED",
      "Leave Rejected",
      message,
      leaveId,
    );
  }
}

// Comp Off awarded notification – with employeeId as related_id for navigation
async function notifyCompOffAwarded(
  employeeId,
  awardedByUserId,
  awardedByName,
  days,
  reason,
) {
  const empRes = await pool.query(
    `SELECT user_id, first_name, last_name FROM employees WHERE id = $1`,
    [employeeId],
  );
  const employeeUserId = empRes.rows[0]?.user_id;
  const employeeName = `${empRes.rows[0]?.first_name} ${empRes.rows[0]?.last_name}`;
  if (!employeeUserId) {
    console.error("Employee user_id not found for comp-off award");
    return;
  }

  // Notify the employee
  await createNotification(
    employeeUserId,
    "COMP_OFF_AWARDED",
    "Comp Off Awarded",
    `🎉 You have been awarded ${days} Comp Off day(s). Reason: ${reason || "No reason provided"}`,
    employeeId, // store employeeId for navigation
  );

  // Get all managers and admins
  const managers = await getManagerUsers(employeeId);
  const admins = await getAdminUsers();
  const recipients = new Set([...managers, ...admins]);
  recipients.delete(awardedByUserId);

  // Notify managers and admins (include employee name)
  for (const userId of recipients) {
    await createNotification(
      userId,
      "COMP_OFF_AWARDED",
      "Comp Off Awarded",
      `🎉 ${employeeName} has been awarded ${days} Comp Off day(s). Awarded by ${awardedByName}.`,
      employeeId, // store employeeId for role‑based navigation
    );
  }
}

module.exports = {
  notifyLeaveSubmitted,
  notifyLeaveApproved,
  notifyLeaveRejected,
  notifyLeaveCancelled,
  notifyCompOffAwarded,
};
