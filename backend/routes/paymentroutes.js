const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../../models/Order');
const { requireStage } = require('../middleware/auth');

const router = express.Router();

router.post('/verify', requireStage('registered'), async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing Razorpay payment fields.' });
    }

    const order = await Order.findOne({
      'razorpay.orderId': razorpay_order_id,
      farmer: req.auth.farmerDbId
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found for this payment.' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'demo-secret')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      order.status = 'failed';
      await order.save();
      return res.status(400).json({ error: 'Payment signature verification failed.' });
    }

    order.status = 'paid';
    order.razorpay.paymentId = razorpay_payment_id;
    order.razorpay.signature = razorpay_signature;
    await order.save();

    return res.json({ ok: true, order });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
