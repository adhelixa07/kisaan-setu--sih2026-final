const express = require('express');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const ctrl = require('../controllers/requirementController');
const bidCtrl = require('../controllers/bidController');

const router = express.Router();

router.post('/', requireAuth, requireRole('buyer'), ctrl.createRequirement);
router.get('/', optionalAuth, ctrl.listRequirements);
router.get('/mine', requireAuth, requireRole('buyer'), ctrl.getMyRequirements);
router.get('/:id', requireAuth, ctrl.getRequirement);
router.patch('/:id', requireAuth, requireRole('buyer'), ctrl.updateRequirement);

// Bids nested under a requirement
router.post('/:requirementId/bids', requireAuth, requireRole('seller'), bidCtrl.createBid);
router.get('/:requirementId/bids/mine', requireAuth, requireRole('seller'), bidCtrl.getMyBidForRequirement);

module.exports = router;