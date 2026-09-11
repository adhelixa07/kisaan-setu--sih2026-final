const crypto = require('crypto');

const OTP_TTL_MS = 60 * 1000;
const MAX_ATTEMPTS = 3;

function generateOtp() {
  return String(100000 + Math.floor(Math.random() * 900000));
}

function hashOtp(mobile, code) {
  return crypto.createHash('sha256').update(`${mobile}:${code}:${process.env.OTP_HASH_SECRET || 'demo-otp-secret'}`).digest('hex');
}

function sendOtp(mobile, code) {
  return Promise.resolve({ ok: true, mobile, code });
}

module.exports = { generateOtp, hashOtp, sendOtp, OTP_TTL_MS, MAX_ATTEMPTS };
