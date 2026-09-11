const express = require("express");
const Razorpay = require("razorpay");
const Order = require("../models/Order");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const COD_FEE = 25;

function generateOrderId() {
  const stamp = Date.now().toString().slice(-8);
  return `KS-${stamp}`;
}

function computeTotal(items, paymentMethod) {
  const itemsTotal = items.reduce((sum, i) => sum + Number(i.qty) * Number(i.price), 0);
  const codFee = paymentMethod === "cod" ? COD_FEE : 0;
  return { itemsTotal, codFee, total: itemsTotal + codFee };
}

// POST /api/orders  { items: [{name, qty, price}], paymentMethod: 'cod'|'online' }
router.post("/", requireAuth("registered"), async (req, res, next) => {
  try {
    const { items, paymentMethod } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Order must include at least one item." });
    }
    if (!["cod", "online"].includes(paymentMethod)) {
      return res.status(400).json({ error: "paymentMethod must be 'cod' or 'online'." });
    }

    // Prices are trusted from req.body here only because this is a demo —
    // in a real store, look up each item's price from your own product
    // collection server-side instead of accepting it from the client.
    const { codFee, total } = computeTotal(items, paymentMethod);
    const orderId = generateOrderId();

    if (paymentMethod === "cod") {
      const order = await Order.create({
        orderId,
        farmer: req.auth.farmerDbId,
        items,
        codFee,
        totalAmount: total,
        paymentMethod: "cod",
        status: "pending_delivery",
      });
      return res.status(201).json({ ok: true, order });
    }

    // Online: create the order in our DB, then create a matching Razorpay
    // order so the amount is fixed server-side before checkout opens.
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const rzpOrder = await instance.orders.create({
      amount: total * 100, // paise
      currency: "INR",
      receipt: orderId,
    });

    const order = await Order.create({
      orderId,
      farmer: req.auth.farmerDbId,
      items,
      codFee,
      totalAmount: total,
      paymentMethod: "online",
      status: "pending_payment",
      razorpay: { orderId: rzpOrder.id },
    });

    res.status(201).json({
      ok: true,
      order,
      razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:orderId
router.get("/:orderId", requireAuth("registered"), async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId, farmer: req.auth.farmerDbId });
    if (!order) return res.status(404).json({ error: "Order not found." });
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders  — order history for the logged-in farmer
router.get("/", requireAuth("registered"), async (req, res, next) => {
  try {
    const orders = await Order.find({ farmer: req.auth.farmerDbId }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
