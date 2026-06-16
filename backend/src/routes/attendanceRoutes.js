// backend/src/routes/attendanceRoutes.js
const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const { authenticate } = require("../middleware/authMiddleware"); // fixed path

// All attendance routes require authentication
router.use(authenticate);

router.post("/check-in", attendanceController.checkIn);
router.post("/check-out", attendanceController.checkOut);
router.get("/my", attendanceController.getMyAttendance);
router.get("/today", attendanceController.getTodayStatus);

router.post("/request", attendanceController.requestAttendance);
router.get("/requests", attendanceController.getAttendanceRequests);
router.put("/requests/:id/approve", attendanceController.approveAttendanceRequest);
router.put("/requests/:id/reject", attendanceController.rejectAttendanceRequest);
router.get("/my-requests", attendanceController.getMyManualRequests);


module.exports = router;