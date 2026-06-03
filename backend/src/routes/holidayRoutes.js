const express = require("express");

const router = express.Router();

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const {
  getHolidays,
  createHoliday
} = require("../controllers/holidayController");

router.get(
  "/",
  authenticate,
  getHolidays
);

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createHoliday
);

module.exports = router;