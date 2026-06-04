const express = require("express");

const router = express.Router();

const { authenticate, authorize } = require("../middleware/authMiddleware");

const {
  applyLeave,
  getMyLeaves,
  getPendingLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
} = require("../controllers/leaveController");

router.post("/apply", authenticate, applyLeave);

router.get("/my", authenticate, getMyLeaves);

router.get("/pending", authenticate, authorize("ADMIN"), getPendingLeaves);

router.put("/:id/approve", authenticate, authorize("ADMIN"), approveLeave);

router.put("/:id/reject", authenticate, authorize("ADMIN"), rejectLeave);

router.put("/:id/cancel", authenticate, cancelLeave);

module.exports = router;
