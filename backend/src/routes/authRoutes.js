const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");

const {
  register,
  login,
  changePassword,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.put("/change-password", authenticate, changePassword);

module.exports = router;
