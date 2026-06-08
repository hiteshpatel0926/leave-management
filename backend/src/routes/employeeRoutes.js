const express = require("express");

const router = express.Router();

const { authenticate, authorize } = require("../middleware/authMiddleware");

const upload = require('../middleware/upload');
const { uploadProfilePicture } = require('../controllers/uploadController');

const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  getEmployeeDetails,      // ✅ new function
  updateEmployee,
  deleteEmployee,
  searchEmployees,
  getPotentialManagers,
  updateEmployeeManager,
  importEmployees,
  exportEmployees,
  getCountries,
  getStates,
  getCities
} = require("../controllers/employeeController");

// ========== Location endpoints ==========
router.get("/locations/countries", authenticate, getCountries);
router.get("/locations/states/:countryId", authenticate, getStates);
router.get("/locations/cities/:stateId", authenticate, getCities);

// ========== Specific routes (no dynamic :id) ==========
router.post("/", authenticate, authorize("ADMIN"), createEmployee);
router.get("/search", authenticate, authorize("ADMIN"), searchEmployees);
router.get("/potential-managers", authenticate, authorize("ADMIN"), getPotentialManagers);
router.post("/import", authenticate, authorize("ADMIN"), importEmployees);
router.get("/export", authenticate, authorize("ADMIN"), exportEmployees);

// ========== Routes with :id but with fixed suffixes ==========
router.put("/:id/profile-picture", upload.single('profilePicture'), uploadProfilePicture);
router.put("/:employeeId/manager", authenticate, authorize("ADMIN"), updateEmployeeManager);

// ========== DETAILS route (must come before generic /:id) ==========
router.get("/:id/details", authenticate, authorize("ADMIN", "EMPLOYEE", "MANAGER"), getEmployeeDetails);

// ========== Generic single‑employee routes (by id) ==========
router.get("/:id", authenticate, authorize("ADMIN", "EMPLOYEE", "MANAGER"), getEmployeeById);
router.put("/:id", authenticate, authorize("ADMIN"), updateEmployee);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteEmployee);

// ========== Get all employees – placed after all param routes ==========
router.get("/", authenticate, authorize("ADMIN", "MANAGER", "EMPLOYEE"), getEmployees);

module.exports = router;