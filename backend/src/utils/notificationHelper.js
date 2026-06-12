// backend/src/utils/notificationHelper.js
const pool = require("../config/db");

// Helper: get direct manager user ID
const getDirectManagerUserId = async (employeeId) => {
  const res = await pool.query(
    `SELECT u.id AS user_id
     FROM employees e
     JOIN employees m ON e.manager_id = m.id
     JOIN users u ON m.user_id = u.id
     WHERE e.id = $1`,
    [employeeId],
  );
  return res.rows[0]?.user_id || null;
};

// Helper: get all admin user IDs
const getAllAdminUserIds = async () => {
  const res = await pool.query(`SELECT id FROM users WHERE role = 'ADMIN'`);
  return res.rows.map((row) => row.id);
};

// Core: create one notification + socket emit
const createNotification = async (
  req,
  userId,
  type,
  title,
  message,
  relatedId = null,
) => {
  if (!userId) return null;
  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, type, title, message, relatedId],
    );
    const notification = result.rows[0];
    const io = req.app.get("io");
    if (io) io.to(`user_${userId}`).emit("new_notification", notification);
    console.log(`[DEBUG] Notification created for user ${userId} (${type})`);
    return notification;
  } catch (err) {
    console.error(`[NOTIFICATION ERROR] user ${userId}:`, err.message);
    return null;
  }
};

// ---------- Submit ----------
const notifyLeaveSubmitted = async (req, leaveId, employeeId, employeeName) => {
  console.log("[DEBUG] notifyLeaveSubmitted start");
  const managerId = await getDirectManagerUserId(employeeId);
  const adminIds = await getAllAdminUserIds();
  const recipients = new Set([managerId, ...adminIds].filter((id) => id));
  console.log("[DEBUG] Recipients for submit:", Array.from(recipients));

  for (const userId of recipients) {
    await createNotification(
      req,
      userId,
      "leave_submitted",
      "New Leave Request",
      `${employeeName} submitted a leave request.`,
      leaveId,
    );
  }
};

// ---------- Approve (fixed) ----------
const notifyLeaveApproved = async (
  req,
  leaveId,
  employeeId,
  actorUserId,
  actorName,
) => {
  console.log("[DEBUG] notifyLeaveApproved start");

  // Get employee's user_id
  const empRes = await pool.query(
    `SELECT user_id FROM employees WHERE id = $1`,
    [employeeId],
  );
  const employeeUserId = empRes.rows[0]?.user_id;
  console.log("[DEBUG] Employee user_id:", employeeUserId);

  const managerId = await getDirectManagerUserId(employeeId);
  const adminIds = await getAllAdminUserIds();

  let recipients = [employeeUserId, managerId, ...adminIds].filter((id) => id);
  console.log("[DEBUG] All potential recipients:", recipients);

  // Remove actor (approver) but only if there are other recipients
  const filtered = recipients.filter((id) => id !== actorUserId);
  const finalRecipients = filtered.length > 0 ? filtered : recipients;

  console.log("[DEBUG] Final recipients after actor filter:", finalRecipients);

  if (finalRecipients.length === 0) {
    console.error("[DEBUG] No recipients for approval – aborting");
    return;
  }

  for (const userId of finalRecipients) {
    const message =
      userId === employeeUserId
        ? "Your leave request was approved."
        : `Leave approved by ${actorName || "an admin"}`;
    await createNotification(
      req,
      userId,
      "leave_approved",
      "Leave Approved",
      message,
      leaveId,
    );
  }
};

// ---------- Reject (same pattern) ----------
const notifyLeaveRejected = async (
  req,
  leaveId,
  employeeId,
  actorUserId,
  actorName,
) => {
  console.log("[DEBUG] notifyLeaveRejected start");
  const empRes = await pool.query(
    `SELECT user_id FROM employees WHERE id = $1`,
    [employeeId],
  );
  const employeeUserId = empRes.rows[0]?.user_id;

  const managerId = await getDirectManagerUserId(employeeId);
  const adminIds = await getAllAdminUserIds();

  let recipients = [employeeUserId, managerId, ...adminIds].filter((id) => id);
  const filtered = recipients.filter((id) => id !== actorUserId);
  const finalRecipients = filtered.length > 0 ? filtered : recipients;

  for (const userId of finalRecipients) {
    const message =
      userId === employeeUserId
        ? "Your leave request was rejected."
        : `Leave rejected by ${actorName || "an admin"}`;
    await createNotification(
      req,
      userId,
      "leave_rejected",
      "Leave Rejected",
      message,
      leaveId,
    );
  }
};

// ---------- Cancel ----------
const notifyLeaveCancelled = async (req, leaveId, employeeId, employeeName) => {
  console.log("[DEBUG] notifyLeaveCancelled start");
  const managerId = await getDirectManagerUserId(employeeId);
  const adminIds = await getAllAdminUserIds();
  const recipients = new Set([managerId, ...adminIds].filter((id) => id));

  for (const userId of recipients) {
    await createNotification(
      req,
      userId,
      "leave_cancelled",
      "Leave Cancelled",
      `${employeeName} cancelled a leave request.`,
      leaveId,
    );
  }
};

module.exports = {
  notifyLeaveSubmitted,
  notifyLeaveApproved,
  notifyLeaveRejected,
  notifyLeaveCancelled,
};
