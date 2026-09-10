const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimit');
const ctrl = require('../controllers/orderController');

const router = express.Router();

router.post('/verify', requireAuth, paymentLimiter, ctrl.verifyPayment);

module.exports = router;