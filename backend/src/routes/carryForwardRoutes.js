const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { carryForwardLeaves } = require('../utils/carryForwardLeaves');

// Only admins can run carry-forward
router.post('/carry-forward', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    await carryForwardLeaves(currentYear, nextYear);
    res.json({ message: `Leave carry-forward from ${currentYear} to ${nextYear} completed.` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process carry-forward', error: error.message });
  }
});

module.exports = router;