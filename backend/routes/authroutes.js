const express = require('express');
const rateLimit = require('express-rate-limit');
const { OtpSession, Farmer } = require('../../models');
const { generateOtp, hashOtp, sendOtp, OTP_TTL_MS, MAX_ATTEMPTS } = require('../utils/otp');
const { signToken } = require('../middleware/auth');

const router = express.Router();
const MOBILE_PATTERN = /^[6-9]\d{9}$/;

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OTP requests. Try again in a few minutes.' }
});

router.post('/send-otp', otpLimiter, async (req, res, next) => {
  try {
    const { mobile } = req.body || {};
    if (!MOBILE_PATTERN.test(mobile || '')) {
      return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });
    }

    const code = generateOtp();
    const codeHash = hashOtp(mobile, code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await OtpSession.findOneAndUpdate(
      { mobile },
      { mobile, codeHash, attemptsLeft: MAX_ATTEMPTS, verified: false, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendOtp(mobile, code);

    const devPayload = process.env.NODE_ENV !== 'production' ? { devOtp: code } : {};
    return res.json({ ok: true, expiresInSeconds: OTP_TTL_MS / 1000, ...devPayload });
  } catch (err) {
    return next(err);
  }
});

router.post('/verify-otp', async (req, res, next) => {
  try {
    const { mobile, otp } = req.body || {};
    if (!MOBILE_PATTERN.test(mobile || '') || !/^\d{6}$/.test(otp || '')) {
      return res.status(400).json({ error: 'Mobile and 6-digit OTP are required.' });
    }

    const session = await OtpSession.findOne({ mobile });
    if (!session) {
      return res.status(400).json({ error: 'No active OTP for this number. Request a new one.' });
    }
    if (session.expiresAt < new Date()) {
      return res.status(400).json({ error: 'OTP expired. Request a new one.' });
    }
    if (session.attemptsLeft <= 0) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Request a new OTP.' });
    }

    const candidateHash = hashOtp(mobile, otp);
    if (candidateHash !== session.codeHash) {
      session.attemptsLeft -= 1;
      await session.save();
      return res.status(400).json({
        error: 'Incorrect code.',
        attemptsLeft: session.attemptsLeft
      });
    }

    session.verified = true;
    await session.save();

    const existingFarmer = await Farmer.findOne({ mobile });
    if (existingFarmer) {
      const token = signToken({
        mobile,
        stage: 'registered',
        farmerId: existingFarmer.farmerId,
        farmerDbId: existingFarmer._id.toString()
      }, '30d');

      return res.json({ ok: true, stage: 'registered', token, farmer: existingFarmer });
    }

    const token = signToken({ mobile, stage: 'otp_verified' }, '10m');
    return res.json({ ok: true, stage: 'otp_verified', token });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
