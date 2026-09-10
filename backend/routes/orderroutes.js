const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { paymentLimiter } = require('../middleware/rateLimit');
const ctrl = require('../controllers/orderController');

const router = express.Router();

router.post('/create', requireAuth, requireRole('buyer'), paymentLimiter, ctrl.createOrder);
router.get('/mine', requireAuth, ctrl.getMyOrders);
router.get('/:id', requireAuth, ctrl.getOrder);
router.post('/:id/complete', requireAuth, requireRole('seller'), ctrl.completeOrder);

module.exports = router;