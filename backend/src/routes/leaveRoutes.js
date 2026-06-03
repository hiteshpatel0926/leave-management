const express = require("express");

const router = express.Router();

const authorize =
require("../middleware/roleMiddleware");

const authenticate =
  require("../middleware/authMiddleware");

const {
  applyLeave,
  getMyLeaves,
  getPendingLeaves,
  approveLeave,
  rejectLeave
} = require("../controllers/leaveController");

router.post(
  "/apply",
  authenticate,
  applyLeave
);

router.get(
  "/my",
  authenticate,
  getMyLeaves
);


router.get(
  "/pending",
  authenticate,
  authorize("ADMIN"),
  getPendingLeaves
);

router.put(
  "/:id/approve",
  authenticate,
  authorize("ADMIN"),
  approveLeave
);

router.put(
  "/:id/reject",
  authenticate,
  authorize("ADMIN"),
  rejectLeave
);

module.exports = router;