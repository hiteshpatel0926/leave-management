const express = require("express");

const router = express.Router();

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday
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


router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  updateHoliday
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  deleteHoliday
);

module.exports = router;