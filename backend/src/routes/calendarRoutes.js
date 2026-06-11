const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { getCalendarEvents } = require('../controllers/calendarController');

router.get('/events', authenticate, getCalendarEvents);

module.exports = router;