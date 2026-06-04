const express = require("express");

const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");

const { getMyProfile } = require("../controllers/profileController");

router.get("/me", authenticate, getMyProfile);

module.exports = router;
