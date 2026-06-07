const express = require("express");

const router = express.Router();

const { authenticate, authorize } = require("../middleware/authMiddleware");

const upload = require('../middleware/upload');
const { uploadProfilePicture } = require('../controllers/uploadController');

const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  searchEmployees,
  getPotentialManagers,
  updateEmployeeManager
} = require("../controllers/employeeController");

// ✅ Specific routes (no dynamic :id)
router.post("/", authenticate, authorize("ADMIN"), createEmployee);
router.get("/search", authenticate, authorize("ADMIN"), searchEmployees);
router.get("/potential-managers", authenticate, authorize("ADMIN"), getPotentialManagers);

// ✅ Routes with :id but with fixed suffixes
router.put("/:id/profile-picture", upload.single('profilePicture'), uploadProfilePicture);
router.put("/:employeeId/manager", authenticate, authorize("ADMIN"), updateEmployeeManager);

// ✅ Generic single‑employee routes (by id)
router.get("/:id", authenticate, authorize("ADMIN", "EMPLOYEE"), getEmployeeById);
router.put("/:id", authenticate, authorize("ADMIN"), updateEmployee);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteEmployee);

// ✅ Get all employees – placed after all param routes
router.get("/", authenticate, authorize("ADMIN", "MANAGER","EMPLOYEE"), getEmployees);


module.exports = router;