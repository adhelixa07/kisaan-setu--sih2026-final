const express = require('express');
const router = express.Router();

router.use('/auth', require('./authroutes'));
router.use('/farmers', require('./farmerroutes'));
router.use('/admin', require('./adminroutes'));
router.use('/assistant', require('./assistantroutes'));
router.use('/bids', require('./bidroutes'));
router.use('/messages', require('./msgroutes'));
router.use('/notifications', require('./notificationroutes'));
router.use('/orders', require('./orderroutes'));
router.use('/payments', require('./payroutes'));
router.use('/payments-verify', require('./paymentroutes'));
router.use('/requirements', require('./requirementroutes'));

router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

module.exports = router;
