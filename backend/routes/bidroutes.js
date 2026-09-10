const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const ctrl = require('../controllers/bidController');

const router = express.Router();

router.post('/:id/accept', requireAuth, requireRole('buyer'), ctrl.acceptBid);
router.post('/:id/reject', requireAuth, requireRole('buyer'), ctrl.rejectBid);
router.post('/:id/counter', requireAuth, requireRole('buyer'), ctrl.counterBid);

module.exports = router;