const express = require("express");

const router = express.Router();

const { authenticate, authorize } = require("../middleware/authMiddleware");

const { getProfile } = require("../controllers/userController");

const { getUsers, resetPassword } = require("../controllers/userController");

router.get("/me", authenticate, getProfile);

router.put(
  "/:id/reset-password",
  authenticate,
  authorize("ADMIN"),
  resetPassword
);

module.exports = router;
