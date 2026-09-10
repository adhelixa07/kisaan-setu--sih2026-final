const express = require('express');

const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/sellers', require('./sellerRoutes'));
router.use('/buyers', require('./buyerRoutes'));
router.use('/farmers', require('./farmerRoutes'));
router.use('/listings', require('./listingRoutes'));
router.use('/requirements', require('./routes/requirementroutes'));
router.use('/bids', require('./routes/bidroutes'));
router.use('/orders', require('./routes/orderroutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/messages', require('./messageRoutes'));
router.use('/notifications', require('./routes/notificationroutes'));
router.use('/assistant', require('./routes/assistantroutes'));
router.use('/admin', require('./routes/adminroutes'));

router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

module.exports = router;