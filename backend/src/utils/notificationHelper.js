// backend/src/utils/notificationHelper.js
const pool = require("../config/db");

// Helper to get manager's user ID from an employee ID
const getManagerUserId = async (employeeId) => {
  const result = await pool.query(
    `SELECT u.id FROM employees e
     JOIN employees m ON e.manager_id = m.id
     JOIN users u ON m.user_id = u.id
     WHERE e.id = $1`,
    [employeeId],
  );
  return result.rows[0]?.id;
};

// Helper to get employee ID from user ID
const getEmployeeIdFromUserId = async (userId) => {
  const result = await pool.query(
    `SELECT id FROM employees WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0]?.id;
};

// Emit real-time notification via Socket.IO
const emitNotification = (req, userId, notification) => {
  const io = req.app.get("io");
  if (io) {
    io.to(`user_${userId}`).emit("new_notification", notification);
  }
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
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, title, message, relatedId],
    );
    const newNotification = result.rows[0];
    if (req) {
      emitNotification(req, userId, newNotification);
    }
    return newNotification;
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};

// Notify all admins and the employee's manager about a new leave request
const notifyAdminsNewLeave = async (req, leaveId, employeeName, employeeId) => {
  try {
    // 1. Notify all admins
    const adminResult = await pool.query(
      `SELECT u.id FROM users u
       JOIN employees e ON e.user_id = u.id
       WHERE u.role = 'ADMIN'`,
    );
    const admins = adminResult.rows;
    for (const admin of admins) {
      await createNotification(
        req,
        admin.id,
        "leave_submitted",
        "New Leave Request",
        `${employeeName} has submitted a leave request.`,
        leaveId,
      );
    }

    // 2. Notify the employee's manager (if any)
    const managerUserId = await getManagerUserId(employeeId);
    if (managerUserId) {
      await createNotification(
        req,
        managerUserId,
        "leave_submitted",
        "Team Member Leave Request",
        `${employeeName} has submitted a leave request awaiting your action.`,
        leaveId,
      );
    }
  } catch (error) {
    console.error("Failed to notify admins/manager:", error);
  }
};

// Notify employee and their manager about leave approval/rejection/cancellation
const notifyEmployeeLeaveUpdate = async (
  req,
  employeeUserId,
  leaveId,
  status,
  leaveType,
  employeeName,
) => {
  const title =
    status === "approved"
      ? "Leave Approved"
      : status === "rejected"
        ? "Leave Rejected"
        : "Leave Cancelled";
  const message =
    status === "approved"
      ? `Your ${leaveType} leave request has been approved.`
      : status === "rejected"
        ? `Your ${leaveType} leave request has been rejected.`
        : `Your ${leaveType} leave request has been cancelled.`;

  // 1. Notify the employee
  await createNotification(
    req,
    employeeUserId,
    `leave_${status}`,
    title,
    message,
    leaveId,
  );

  // 2. Notify the employee's manager (if any)
  const employeeId = await getEmployeeIdFromUserId(employeeUserId);
  if (employeeId) {
    const managerUserId = await getManagerUserId(employeeId);
    if (managerUserId) {
      const managerMessage =
        status === "approved"
          ? `${employeeName}'s ${leaveType} leave request has been approved.`
          : status === "rejected"
            ? `${employeeName}'s ${leaveType} leave request has been rejected.`
            : `${employeeName}'s ${leaveType} leave request has been cancelled.`;
      await createNotification(
        req,
        managerUserId,
        `leave_${status}`,
        `${status.charAt(0).toUpperCase() + status.slice(1)} - Team Member`,
        managerMessage,
        leaveId,
      );
    }
  }
};

module.exports = {
  createNotification,
  notifyAdminsNewLeave,
  notifyEmployeeLeaveUpdate,
};
