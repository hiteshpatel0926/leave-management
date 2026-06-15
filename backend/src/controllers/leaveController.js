const pool = require("../config/db");
const currentYear = new Date().getFullYear();
const {
  notifyLeaveSubmitted,
  notifyLeaveApproved,
  notifyLeaveRejected,
  notifyLeaveCancelled,
} = require("../utils/notificationHelper");

function calculateWorkingDays(startDate, endDate, holidays) {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getDay();
    const currentDate = current.toISOString().split("T")[0];
    const isHoliday = holidays.includes(currentDate);

    if (day !== 0 && day !== 6 && !isHoliday) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

const applyLeave = async (req, res) => {
  try {
    const employee = await pool.query(
      `SELECT id, first_name, last_name FROM employees WHERE user_id = $1`,
      [req.user.userId],
    );

    if (employee.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const employeeId = employee.rows[0].id;
    const employeeName = `${employee.rows[0].first_name} ${employee.rows[0].last_name}`;
    const {
      leave_type_id,
      start_date,
      end_date,
      reason,
      total_days: customTotalDays,
      session,      // <-- new field (only for half‑day)
    } = req.body;
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const leaveYear = startDate.getFullYear();
    const leaveTypeIdNum = Number(leave_type_id);

    // ========== UPDATED OVERLAP CHECK (supports half‑day sessions) ==========
    // Get all overlapping leaves (same employee, date range)
    const overlapCheck = await pool.query(
      `SELECT id, start_date, end_date, status, session
       FROM leave_requests
       WHERE employee_id = $1
         AND status IN ('PENDING','APPROVED')
         AND start_date <= $3
         AND end_date >= $2`,
      [employeeId, start_date, end_date],
    );

    // If this is a half‑day leave
    if (customTotalDays === 0.5) {
      // Validate session presence
      if (!session || !['first_half', 'second_half'].includes(session)) {
        return res.status(400).json({ message: "For half‑day leave, session (first_half/second_half) is required" });
      }
      // Check only leaves on the exact same day
      const sameDayLeaves = overlapCheck.rows.filter(l => 
        new Date(l.start_date).toDateString() === startDate.toDateString()
      );
      for (const existing of sameDayLeaves) {
        if (existing.session === null) {
          // Full day leave exists → conflict
          return res.status(400).json({ message: `Cannot apply half‑day: a full day leave already exists on ${start_date}` });
        }
        if (existing.session === session) {
          // Same half already occupied
          return res.status(400).json({ message: `You already have a ${session} leave on ${start_date}` });
        }
      }
    } else {
      // Full‑day or multi‑day leave: any overlap is a conflict (including half‑day leaves)
      if (overlapCheck.rows.length > 0) {
        const existing = overlapCheck.rows[0];
        const start = existing.start_date.toLocaleDateString("en-GB");
        const end = existing.end_date.toLocaleDateString("en-GB");
        return res.status(400).json({
          message: `Overlaps with existing ${existing.status} leave (${start} - ${end})`,
        });
      }
    }
    // ========== END OF OVERLAP UPDATE ==========

    // Get holidays for the leave's year
    const holidayResult = await pool.query(
      `SELECT holiday_date FROM holidays
       WHERE EXTRACT(YEAR FROM holiday_date) = $1`,
      [leaveYear],
    );
    const holidays = holidayResult.rows.map(
      (h) => h.holiday_date.toISOString().split("T")[0],
    );

    if (startDate > endDate) {
      return res
        .status(400)
        .json({ message: "End date cannot be before start date" });
    }

    // Validate leave type
    const leaveType = await pool.query(
      `SELECT * FROM leave_types WHERE id = $1`,
      [leave_type_id],
    );
    if (leaveType.rows.length === 0) {
      return res.status(404).json({ message: "Invalid leave type" });
    }

    let totalDays;
    if (customTotalDays !== undefined && customTotalDays > 0) {
      if (customTotalDays !== 0.5) {
        return res.status(400).json({
          message: "Custom total days can only be 0.5 for half‑day leave",
        });
      }
      if (startDate.toDateString() !== endDate.toDateString()) {
        return res
          .status(400)
          .json({ message: "Half‑day leave must be on a single day" });
      }
      const dayOfWeek = startDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidays.includes(start_date);
      if (isWeekend || isHoliday) {
        return res.status(400).json({
          message: "Half‑day leave cannot be applied on a weekend or holiday",
        });
      }
      totalDays = customTotalDays;
    } else {
      totalDays = calculateWorkingDays(startDate, endDate, holidays);
      if (totalDays <= 0) {
        return res
          .status(400)
          .json({ message: "Selected dates contain no working days" });
      }
    }

    // Skip balance check for Leave Without Pay (id = 6)
    if (leaveTypeIdNum !== 6) {
      const balanceResult = await pool.query(
        `SELECT * FROM leave_balances
         WHERE employee_id = $1
           AND leave_type_id = $2
           AND year = $3`,
        [employeeId, leave_type_id, leaveYear],
      );

      if (balanceResult.rows.length === 0) {
        return res
          .status(400)
          .json({ message: "Leave balance not found for this year" });
      }

      const available = Number(balanceResult.rows[0].balance_days);
      if (totalDays > available) {
        return res.status(400).json({ message: "Insufficient leave balance" });
      }
    }

    // Insert leave request (include session)
    const result = await pool.query(
      `INSERT INTO leave_requests
       (employee_id, leave_type_id, start_date, end_date, total_days, reason, session)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [employeeId, leave_type_id, start_date, end_date, totalDays, reason, session || null],
    );

    const newLeaveId = result.rows[0].id;

    // Fire notification asynchronously
    notifyLeaveSubmitted(employeeId, employeeName, newLeaveId).catch((err) =>
      console.error("[NOTIFICATION ERROR] Submitted:", err.message),
    );

    res.status(201).json({
      message: "Leave applied successfully",
      leave: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getMyLeaves = async (req, res) => {
  try {
    const employee = await pool.query(
      `SELECT id FROM employees WHERE user_id = $1`,
      [req.user.userId],
    );

    if (employee.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const employeeId = employee.rows[0].id;

    const result = await pool.query(
      `SELECT lr.*, lt.name AS leave_type
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE employee_id = $1
       ORDER BY applied_at DESC`,
      [employeeId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getPendingLeaves = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lr.*, e.first_name, e.last_name, lt.name AS leave_type
       FROM leave_requests lr
       JOIN employees e ON e.id = lr.employee_id
       JOIN leave_types lt ON lt.id = lr.leave_type_id
       WHERE lr.status = 'PENDING'
       ORDER BY lr.applied_at`,
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const approveLeave = async (req, res) => {
  console.log("🔥🔥🔥 APPROVE LEAVE CONTROLLER EXECUTING 🔥🔥🔥");
  console.log("Leave ID:", req.params.id);
  console.log("Admin user ID:", req.user.userId);

  try {
    await pool.query("BEGIN");

    const leaveId = req.params.id;
    const adminId = req.user.userId;

    const leave = await pool.query(
      `SELECT lr.*, lt.name AS leave_type, e.user_id AS employee_user_id, e.id AS employee_id
       FROM leave_requests lr
       JOIN leave_types lt ON lt.id = lr.leave_type_id
       JOIN employees e ON e.id = lr.employee_id
       WHERE lr.id = $1`,
      [leaveId],
    );

    if (leave.rows.length === 0) {
      console.log("Leave not found");
      return res.status(404).json({ message: "Leave not found" });
    }

    const leaveRequest = leave.rows[0];
    console.log("Leave request details:", {
      id: leaveRequest.id,
      employee_id: leaveRequest.employee_id,
      leave_type_id: leaveRequest.leave_type_id,
      total_days: leaveRequest.total_days,
      status: leaveRequest.status,
      start_date: leaveRequest.start_date,
    });

    const leaveTypeIdNum = Number(leaveRequest.leave_type_id);
    const leaveYear = new Date(leaveRequest.start_date).getFullYear();

    console.log("leaveYear:", leaveYear);
    console.log("leaveTypeIdNum:", leaveTypeIdNum);

    if (leaveRequest.status !== "PENDING") {
      console.log("Leave not pending, status:", leaveRequest.status);
      return res
        .status(400)
        .json({ message: `Leave already ${leaveRequest.status}` });
    }

    // Skip balance check and deduction for Leave Without Pay (id = 6)
    if (leaveTypeIdNum !== 6) {
      console.log("Checking leave_balances for:", {
        employee_id: leaveRequest.employee_id,
        leave_type_id: leaveRequest.leave_type_id,
        year: leaveYear,
      });
      const balance = await pool.query(
        `SELECT * FROM leave_balances
         WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3`,
        [leaveRequest.employee_id, leaveRequest.leave_type_id, leaveYear],
      );
      console.log("Balance query result rows:", balance.rows.length);
      if (balance.rows.length === 0) {
        console.log("Balance row not found, will attempt to create");
        const leaveTypeRes = await pool.query(
          `SELECT annual_entitlement FROM leave_types WHERE id = $1`,
          [leaveRequest.leave_type_id],
        );
        const defaultEntitlement =
          leaveTypeRes.rows[0]?.annual_entitlement || 0;
        console.log("Default entitlement:", defaultEntitlement);
        await pool.query(
          `INSERT INTO leave_balances (employee_id, leave_type_id, year, entitled_days, used_days, balance_days)
           VALUES ($1, $2, $3, $4, 0, $4)`,
          [
            leaveRequest.employee_id,
            leaveRequest.leave_type_id,
            leaveYear,
            defaultEntitlement,
          ],
        );
        // Refetch
        const newBalance = await pool.query(
          `SELECT * FROM leave_balances
           WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3`,
          [leaveRequest.employee_id, leaveRequest.leave_type_id, leaveYear],
        );
        if (newBalance.rows.length === 0) {
          console.log("Failed to create balance row");
          await pool.query("ROLLBACK");
          return res
            .status(400)
            .json({ message: "Could not create leave balance" });
        }
      }

      // Fetch current balance again
      const currentBalance = await pool.query(
        `SELECT balance_days FROM leave_balances
         WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3`,
        [leaveRequest.employee_id, leaveRequest.leave_type_id, leaveYear],
      );
      const available = Number(currentBalance.rows[0].balance_days);
      const totalDaysNum = Number(leaveRequest.total_days);
      console.log(
        "Available balance:",
        available,
        "Requested days:",
        totalDaysNum,
      );
      if (available < totalDaysNum) {
        console.log("Insufficient balance");
        await pool.query("ROLLBACK");
        return res
          .status(400)
          .json({ message: "Insufficient balance for approval" });
      }
    }

    // Update leave request status
    await pool.query(
      `UPDATE leave_requests SET status = 'APPROVED', approved_by = $1, approved_at = NOW() WHERE id = $2`,
      [adminId, leaveId],
    );
    console.log("Leave request status updated to APPROVED");

    // Deduct balance if not LOP
    if (leaveTypeIdNum !== 6) {
      const totalDaysNum = parseFloat(leaveRequest.total_days);
      console.log("Deducting days:", totalDaysNum);
      const updateResult = await pool.query(
        `UPDATE leave_balances
         SET used_days = used_days + $1, balance_days = balance_days - $1
         WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4`,
        [
          totalDaysNum,
          leaveRequest.employee_id,
          leaveRequest.leave_type_id,
          leaveYear,
        ],
      );
      console.log("Update rowCount:", updateResult.rowCount);
      if (updateResult.rowCount === 0) {
        console.log("No rows updated for balance deduction");
        await pool.query("ROLLBACK");
        return res
          .status(400)
          .json({ message: "Failed to update leave balance" });
      } else {
        console.log("Balance updated successfully");
      }
    }

    await pool.query("COMMIT");

    console.log("AFTER COMMIT REACHED");

    return res.json({
      message: "AFTER COMMIT TEST",
    });

    const actorRes = await pool.query(
      `
  SELECT first_name,last_name
  FROM employees
  WHERE user_id = $1
  `,
      [adminId],
    );

    const actorName = actorRes.rows.length
      ? `${actorRes.rows[0].first_name} ${actorRes.rows[0].last_name}`
      : "Admin";

    console.log("=== APPROVAL NOTIFICATION START ===");

    notifyLeaveApproved(
      leaveRequest.employee_id,
      adminId,
      actorName,
      leaveId,
    ).catch((err) =>
      console.error("[NOTIFICATION ERROR] Approved:", err.message),
    );

    console.log("=== APPROVAL NOTIFICATION END ===");

    res.json({ message: "Leave Approved" });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("ERROR in approveLeave:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const rejectLeave = async (req, res) => {
  try {
    const leaveId = req.params.id;

    const leave = await pool.query(
      `SELECT lr.*, lt.name AS leave_type, e.user_id AS employee_user_id, e.id AS employee_id
       FROM leave_requests lr
       JOIN leave_types lt ON lt.id = lr.leave_type_id
       JOIN employees e ON e.id = lr.employee_id
       WHERE lr.id = $1`,
      [leaveId],
    );

    if (leave.rows.length === 0) {
      return res.status(404).json({ message: "Leave not found" });
    }

    const leaveRequest = leave.rows[0];

    await pool.query(
      `UPDATE leave_requests SET status = 'REJECTED' WHERE id = $1`,
      [leaveId],
    );

    const actorRes = await pool.query(
      `SELECT first_name, last_name FROM employees WHERE user_id = $1`,
      [req.user.userId],
    );
    const actorName = actorRes.rows[0]
      ? `${actorRes.rows[0].first_name} ${actorRes.rows[0].last_name}`
      : "Admin";

    // Fire notification asynchronously
    console.log("=== REJECTION NOTIFICATION START ===");

    notifyLeaveRejected(
      leaveRequest.employee_id,
      req.user.userId,
      actorName,
      leaveId,
    ).catch((err) =>
      console.error("[NOTIFICATION ERROR] Rejected:", err.message),
    );
    console.log("=== REJECTION NOTIFICATION END ===");

    res.json({ message: "Leave Rejected" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const cancelLeave = async (req, res) => {
  try {
    const leaveId = req.params.id;
    const userId = req.user.userId;

    const employeeRes = await pool.query(
      `SELECT id, first_name, last_name FROM employees WHERE user_id = $1`,
      [userId],
    );
    if (employeeRes.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const employeeId = employeeRes.rows[0].id;
    const employeeFirstName = employeeRes.rows[0].first_name;
    const employeeLastName = employeeRes.rows[0].last_name;

    const leaveRes = await pool.query(
      `SELECT lr.*, lt.name AS leave_type, e.user_id AS employee_user_id
       FROM leave_requests lr
       JOIN leave_types lt ON lt.id = lr.leave_type_id
       JOIN employees e ON e.id = lr.employee_id
       WHERE lr.id = $1 AND lr.employee_id = $2`,
      [leaveId, employeeId],
    );
    if (leaveRes.rows.length === 0) {
      return res.status(404).json({ message: "Leave not found" });
    }
    const leave = leaveRes.rows[0];

    if (leave.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: "Only pending leaves can be cancelled" });
    }

    await pool.query(
      `UPDATE leave_requests SET status = 'CANCELLED' WHERE id = $1`,
      [leaveId],
    );

    const employeeName = `${employeeFirstName} ${employeeLastName}`;
    // Fire notification asynchronously
    notifyLeaveCancelled(employeeId, employeeName, leaveId).catch((err) =>
      console.error("[NOTIFICATION ERROR] Cancelled:", err.message),
    );

    res.json({ message: "Leave cancelled successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getPendingLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
};
