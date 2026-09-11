const crypto = require("crypto");

const OTP_TTL_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 3;

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function hashOtp(mobile, code) {
  const secret = process.env.OTP_HASH_SECRET || "dev-only-secret";
  return crypto.createHash("sha256").update(`${mobile}:${code}:${secret}`).digest("hex");
}

// NOTE: this only generates and hashes a code — it does not send anything.
// Wire `sendOtp` to a real, DLT-registered SMS provider (MSG91, Kaleyra,
// AWS SNS India route, etc.) before using this in production. Until then,
// the routes layer returns the code in the API response ONLY when
// NODE_ENV !== 'production', purely so this backend is testable end-to-end.
async function sendOtp(mobile, code) {
  console.log(`[otp:dev-only] would SMS ${code} to +91${mobile}`);
  return true;
}

module.exports = { generateOtp, hashOtp, sendOtp, OTP_TTL_MS, MAX_ATTEMPTS };
