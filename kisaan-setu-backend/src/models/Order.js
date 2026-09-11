const { Schema, model } = require("mongoose");

const orderItemSchema = new Schema(
  {
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }, // price per unit, in rupees
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true }, // e.g. KS-20240912
    farmer: { type: Schema.Types.ObjectId, ref: "Farmer", required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    codFee: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true }, // rupees
    paymentMethod: { type: String, enum: ["cod", "online"], required: true },
    status: {
      type: String,
      enum: ["pending_delivery", "pending_payment", "paid", "failed"],
      required: true,
      default: "pending_payment",
    },
    razorpay: {
      orderId: { type: String },
      paymentId: { type: String },
      signature: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = model("Order", orderSchema);
