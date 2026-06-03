const express = require("express");

const router = express.Router();

const authenticate =
  require("../middleware/authMiddleware");

const authorize =
  require("../middleware/roleMiddleware");

const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  searchEmployees
} = require("../controllers/employeeController");

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createEmployee
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  updateEmployee
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  deleteEmployee
);

router.get(
  "/search",
  authenticate,
  authorize("ADMIN"),
  searchEmployees
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "EMPLOYEE"),
  getEmployeeById
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN", "EMPLOYEE"),
  getEmployees
);



module.exports = router;