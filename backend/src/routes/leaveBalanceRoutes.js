const express = require("express");

const router = express.Router();

const { getMyLeaveBalances } = require("../controllers/leaveBalanceController");

const { authenticate } = require("../middleware/authMiddleware");

router.get("/my-balance", authenticate, getMyLeaveBalances);

module.exports = router;
