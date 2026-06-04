const express = require("express");

const router = express.Router();

const { authenticate, authorize } = require("../middleware/authMiddleware");

const {
  getEmployeeDetails,
} = require("../controllers/employeeProfileController");

router.get(
  "/:id/details",
  authenticate,
  authorize("ADMIN"),
  getEmployeeDetails,
);

module.exports = router;
