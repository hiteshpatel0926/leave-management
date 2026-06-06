const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getTeam,
  getTeamLeaveBalances,
  getTeamPendingLeaves,
  updateTeamLeaveStatus,
} = require('../controllers/managerController');

// All routes require authentication and role MANAGER or ADMIN
router.use(authenticate);
router.use(authorize('MANAGER', 'ADMIN'));

router.get('/team', getTeam);
router.get('/team/leave-balances', getTeamLeaveBalances);
router.get('/team/pending-leaves', getTeamPendingLeaves);
router.put('/team/leave/:leaveId', updateTeamLeaveStatus);

module.exports = router;