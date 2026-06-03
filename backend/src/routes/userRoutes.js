const express = require("express");

const router = express.Router();

const authenticate =
require("../middleware/authMiddleware");

const {
  getProfile
} = require("../controllers/userController");

router.get(
  "/me",
  authenticate,
  getProfile
);

module.exports = router;