// backend/src/utils/notificationHelper.js
const pool = require("../config/db");

// ---------- Internal helpers ----------
const getEmployeeIdFromUserId = async (userId) => {
  const res = await pool.query(`SELECT id FROM employees WHERE user_id = $1`, [
    userId,
  ]);
  return res.rows[0]?.id;
};

/**
 * Recursively get all manager user IDs above an employee.
 * Returns an array of user IDs (direct manager, skip‑level managers, up to top).
 */
const getAllManagerUserIds = async (employeeId) => {
  const managerIds = new Set();
  let currentEmpId = employeeId;

  while (currentEmpId) {
    // Get the manager_id of the current employee
    const res = await pool.query(
      `SELECT manager_id FROM employees WHERE id = $1`,
      [currentEmpId],
    );
    const managerEmpId = res.rows[0]?.manager_id;
    if (!managerEmpId) break;

    // Get the user_id of that manager employee
    const userRes = await pool.query(
      `SELECT user_id FROM employees WHERE id = $1`,
      [managerEmpId],
    );
    const managerUserId = userRes.rows[0]?.user_id;
    if (managerUserId) managerIds.add(managerUserId);

    // Move up the chain
    currentEmpId = managerEmpId;
  }
  return Array.from(managerIds);
};

const getAllAdminUserIds = async () => {
  const res = await pool.query(`SELECT id FROM users WHERE role = 'ADMIN'`);
  return res.rows.map((row) => row.id);
};

const createNotification = async (
  req,
  userId,
  type,
  title,
  message,
  relatedId = null,
) => {
  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, type, title, message, relatedId],
    );
    const notification = result.rows[0];
    const io = req.app.get("io");
    if (io) io.to(`user_${userId}`).emit("new_notification", notification);
    return notification;
  } catch (err) {
    console.error(`[NOTIFICATION] Failed for user ${userId}:`, err);
    return null;
  }
};

// ---------- Public notification functions (multi‑level hierarchy) ----------

// 1. Employee submits leave → notify all managers (direct + skip) + all admins
const notifyLeaveSubmitted = async (req, leaveId, employeeId, employeeName) => {
  const managerIds = await getAllManagerUserIds(employeeId);
  const adminIds = await getAllAdminUserIds();

  for (const mgrId of managerIds) {
    await createNotification(
      req,
      mgrId,
      "leave_submitted",
      "Team Member Leave Request",
      `${employeeName} has submitted a leave request awaiting your action.`,
      leaveId,
    );
  }
  for (const adminId of adminIds) {
    await createNotification(
      req,
      adminId,
      "leave_submitted",
      "New Leave Request",
      `${employeeName} has submitted a leave request.`,
      leaveId,
    );
  }
};

// 2. Leave approved (by manager or admin) → notify employee, all managers (except actor), all admins (except actor)
const notifyLeaveApproved = async (
  req,
  leaveId,
  employeeId,
  actorUserId,
  actorName,
) => {
  const empRes = await pool.query(
    `SELECT user_id FROM employees WHERE id = $1`,
    [employeeId],
  );
  const employeeUserId = empRes.rows[0]?.user_id;
  if (!employeeUserId) return;

  const managerIds = await getAllManagerUserIds(employeeId);
  const adminIds = await getAllAdminUserIds();

  // Employee (if not the actor)
  if (employeeUserId !== actorUserId) {
    await createNotification(
      req,
      employeeUserId,
      "leave_approved",
      "Leave Approved",
      `Your leave request has been approved.`,
      leaveId,
    );
  }

  // All managers (except actor)
  for (const mgrId of managerIds) {
    if (mgrId !== actorUserId) {
      await createNotification(
        req,
        mgrId,
        "leave_approved",
        "Leave Approved - Team Member",
        `The leave request of employee has been approved.`,
        leaveId,
      );
    }
  }

  // All admins (except actor)
  for (const adminId of adminIds) {
    if (adminId !== actorUserId) {
      await createNotification(
        req,
        adminId,
        "leave_approved",
        "Leave Approved",
        `Leave for employee has been approved by ${actorName || "an administrator"}.`,
        leaveId,
      );
    }
  }
};

// 3. Leave rejected – same pattern as approval
const notifyLeaveRejected = async (
  req,
  leaveId,
  employeeId,
  actorUserId,
  actorName,
) => {
  const empRes = await pool.query(
    `SELECT user_id FROM employees WHERE id = $1`,
    [employeeId],
  );
  const employeeUserId = empRes.rows[0]?.user_id;
  if (!employeeUserId) return;

  const managerIds = await getAllManagerUserIds(employeeId);
  const adminIds = await getAllAdminUserIds();

  if (employeeUserId !== actorUserId) {
    await createNotification(
      req,
      employeeUserId,
      "leave_rejected",
      "Leave Rejected",
      `Your leave request has been rejected.`,
      leaveId,
    );
  }
  for (const mgrId of managerIds) {
    if (mgrId !== actorUserId) {
      await createNotification(
        req,
        mgrId,
        "leave_rejected",
        "Leave Rejected - Team Member",
        `The leave request of employee has been rejected.`,
        leaveId,
      );
    }
  }
  for (const adminId of adminIds) {
    if (adminId !== actorUserId) {
      await createNotification(
        req,
        adminId,
        "leave_rejected",
        "Leave Rejected",
        `Leave for employee has been rejected by ${actorName || "an administrator"}.`,
        leaveId,
      );
    }
  }
};

// 4. Employee cancels own pending leave → notify all managers + all admins
const notifyLeaveCancelled = async (req, leaveId, employeeId, employeeName) => {
  const managerIds = await getAllManagerUserIds(employeeId);
  const adminIds = await getAllAdminUserIds();

  for (const mgrId of managerIds) {
    await createNotification(
      req,
      mgrId,
      "leave_cancelled",
      "Leave Cancelled - Team Member",
      `${employeeName} has cancelled their leave request.`,
      leaveId,
    );
  }
  for (const adminId of adminIds) {
    await createNotification(
      req,
      adminId,
      "leave_cancelled",
      "Leave Cancelled",
      `${employeeName} has cancelled their leave request.`,
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
