// backend/src/utils/notificationHelper.js
const pool = require('../config/db');

// Function to emit real-time notification via Socket.IO
const emitNotification = (req, userId, notification) => {
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${userId}`).emit('new_notification', notification);
  }
};

const createNotification = async (req, userId, type, title, message, relatedId = null) => {
  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, title, message, relatedId]
    );
    const newNotification = result.rows[0];
    
    // Emit real-time event if req (request object) is available
    if (req) {
      emitNotification(req, userId, newNotification);
    }
    
    return newNotification;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

// Notify all admins about a new leave request
const notifyAdminsNewLeave = async (req, leaveId, employeeName) => {
  try {
    const adminResult = await pool.query(
      `SELECT u.id FROM users u
       JOIN employees e ON e.user_id = u.id
       WHERE u.role = 'ADMIN'`
    );
    const admins = adminResult.rows;
    for (const admin of admins) {
      await createNotification(
        req,
        admin.id,
        'leave_submitted',
        'New Leave Request',
        `${employeeName} has submitted a leave request.`,
        leaveId
      );
    }
  } catch (error) {
    console.error('Failed to notify admins:', error);
  }
};

// Notify employee about leave approval/rejection
const notifyEmployeeLeaveUpdate = async (req, employeeUserId, leaveId, status, leaveType) => {
  const title = status === 'approved' ? 'Leave Approved' : 'Leave Rejected';
  const message = status === 'approved' 
    ? `Your ${leaveType} leave request has been approved.`
    : `Your ${leaveType} leave request has been rejected.`;
  await createNotification(req, employeeUserId, `leave_${status}`, title, message, leaveId);
};

module.exports = {
  createNotification,
  notifyAdminsNewLeave,
  notifyEmployeeLeaveUpdate,
};