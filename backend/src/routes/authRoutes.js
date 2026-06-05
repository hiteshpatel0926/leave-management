const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");

const {
  register,
  login,
  changePassword,
  forgotPassword,   // ← add this
  resetPassword,    // ← add this
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);   // ← add this line
router.post("/reset-password", resetPassword);     // ← add this line
router.put("/change-password", authenticate, changePassword);

module.exports = router;