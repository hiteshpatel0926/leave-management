const pool = require("../config/db");

// ONE function to rule them all - creates notification and sends via socket
const sendNotification = async (req, userId, type, title, message, relatedId = null) => {
  // Don't proceed if no userId
  if (!userId) {
    console.log(`❌ Cannot send notification: No userId provided`);
    return false;
  }

  try {
    // Insert into database
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [userId, type, title, message, relatedId]
    );

    const notification = result.rows[0];
    console.log(`✅ Notification saved for user ${userId}: ${type}`);

    // Send via socket if available
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${userId}`).emit("new_notification", notification);
      console.log(`📡 Socket emitted to user_${userId}`);
    } else {
      console.log(`⚠️ Socket.io not available`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to send notification to ${userId}:`, error.message);
    return false;
  }
};

// Submit notification - notify all admins + direct manager
const notifySubmit = async (req, leaveId, employeeId, employeeName) => {
  console.log(`📢 Sending SUBMIT notifications for ${employeeName}`);
  
  // Get direct manager
  const managerResult = await pool.query(`
    SELECT u.id as user_id
    FROM employees e
    JOIN employees m ON e.manager_id = m.id
    JOIN users u ON m.user_id = u.id
    WHERE e.id = $1
  `, [employeeId]);
  
  const managerId = managerResult.rows[0]?.user_id;
  
  // Get all admins
  const adminResult = await pool.query(`SELECT id FROM users WHERE role = 'ADMIN'`);
  const adminIds = adminResult.rows.map(r => r.id);
  
  // Combine recipients (managers + admins)
  const recipients = [...new Set([managerId, ...adminIds].filter(id => id))];
  
  console.log(`📨 Sending to:`, recipients);
  
  for (const userId of recipients) {
    await sendNotification(
      req, 
      userId, 
      'leave_submitted', 
      'New Leave Request', 
      `${employeeName} submitted a leave request.`, 
      leaveId
    );
  }
};

// Approve notification - notify employee + all admins + manager (except approver)
const notifyApprove = async (req, leaveId, employeeId, approverId, approverName) => {
  console.log(`📢 Sending APPROVE notifications for leave ${leaveId}`);
  
  // Get employee's user_id
  const employeeResult = await pool.query(`
    SELECT u.id as user_id 
    FROM employees e 
    JOIN users u ON e.user_id = u.id 
    WHERE e.id = $1
  `, [employeeId]);
  
  const employeeUserId = employeeResult.rows[0]?.user_id;
  
  // Get manager
  const managerResult = await pool.query(`
    SELECT u.id as user_id
    FROM employees e
    JOIN employees m ON e.manager_id = m.id
    JOIN users u ON m.user_id = u.id
    WHERE e.id = $1
  `, [employeeId]);
  
  const managerId = managerResult.rows[0]?.user_id;
  
  // Get all admins
  const adminResult = await pool.query(`SELECT id FROM users WHERE role = 'ADMIN'`);
  const adminIds = adminResult.rows.map(r => r.id);
  
  // Combine all possible recipients
  let recipients = [employeeUserId, managerId, ...adminIds].filter(id => id);
  
  // Remove the person who approved (don't notify themselves)
  recipients = recipients.filter(id => id !== approverId);
  
  // If no recipients left, at least notify the employee
  if (recipients.length === 0 && employeeUserId) {
    recipients = [employeeUserId];
  }
  
  console.log(`📨 Sending to:`, recipients);
  
  for (const userId of recipients) {
    const message = userId === employeeUserId 
      ? "✅ Your leave request has been approved!" 
      : `✅ Leave approved by ${approverName}`;
      
    await sendNotification(req, userId, 'leave_approved', 'Leave Approved', message, leaveId);
  }
};

// Reject notification
const notifyReject = async (req, leaveId, employeeId, rejecterId, rejecterName) => {
  console.log(`📢 Sending REJECT notifications for leave ${leaveId}`);
  
  const employeeResult = await pool.query(`
    SELECT u.id as user_id 
    FROM employees e 
    JOIN users u ON e.user_id = u.id 
    WHERE e.id = $1
  `, [employeeId]);
  
  const employeeUserId = employeeResult.rows[0]?.user_id;
  
  const managerResult = await pool.query(`
    SELECT u.id as user_id
    FROM employees e
    JOIN employees m ON e.manager_id = m.id
    JOIN users u ON m.user_id = u.id
    WHERE e.id = $1
  `, [employeeId]);
  
  const managerId = managerResult.rows[0]?.user_id;
  
  const adminResult = await pool.query(`SELECT id FROM users WHERE role = 'ADMIN'`);
  const adminIds = adminResult.rows.map(r => r.id);
  
  let recipients = [employeeUserId, managerId, ...adminIds].filter(id => id);
  recipients = recipients.filter(id => id !== rejecterId);
  
  if (recipients.length === 0 && employeeUserId) {
    recipients = [employeeUserId];
  }
  
  console.log(`📨 Sending to:`, recipients);
  
  for (const userId of recipients) {
    const message = userId === employeeUserId 
      ? "❌ Your leave request has been rejected." 
      : `❌ Leave rejected by ${rejecterName}`;
      
    await sendNotification(req, userId, 'leave_rejected', 'Leave Rejected', message, leaveId);
  }
};

// Cancel notification
const notifyCancel = async (req, leaveId, employeeId, employeeName) => {
  console.log(`📢 Sending CANCEL notifications for ${employeeName}`);
  
  const managerResult = await pool.query(`
    SELECT u.id as user_id
    FROM employees e
    JOIN employees m ON e.manager_id = m.id
    JOIN users u ON m.user_id = u.id
    WHERE e.id = $1
  `, [employeeId]);
  
  const managerId = managerResult.rows[0]?.user_id;
  
  const adminResult = await pool.query(`SELECT id FROM users WHERE role = 'ADMIN'`);
  const adminIds = adminResult.rows.map(r => r.id);
  
  const recipients = [...new Set([managerId, ...adminIds].filter(id => id))];
  
  console.log(`📨 Sending to:`, recipients);
  
  for (const userId of recipients) {
    await sendNotification(
      req, 
      userId, 
      'leave_cancelled', 
      'Leave Cancelled', 
      `${employeeName} cancelled a leave request.`, 
      leaveId
    );
  }
};

module.exports = {
  sendNotification,
  notifySubmit,
  notifyApprove,
  notifyReject,
  notifyCancel
};