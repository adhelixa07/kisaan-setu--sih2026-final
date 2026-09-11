const { Schema, model } = require("mongoose");

// Short-lived collection: one active OTP challenge per mobile number.
// The `expiresAt` TTL index lets MongoDB garbage-collect stale/expired
// sessions automatically, so we never accumulate dead rows.
const otpSessionSchema = new Schema(
  {
    mobile: { type: String, required: true, index: true, match: /^[6-9]\d{9}$/ },
    codeHash: { type: String, required: true },
    attemptsLeft: { type: Number, required: true, default: 3 },
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

otpSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = model("OtpSession", otpSessionSchema);
