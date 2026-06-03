const express =
require("express");

const router =
express.Router();

const {
  getLeaveTypes
} =
require(
  "../controllers/leaveTypeController"
);

router.get(
  "/",
  getLeaveTypes
);

module.exports = router;