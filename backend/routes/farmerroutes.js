const express = require('express');
const Farmer = require('../../models/Farmer');
const { lookupEnam } = require('../utils/enamMock');
const { requireStage, signToken } = require('../middleware/auth');

const router = express.Router();

function generateFarmerId() {
  const stamp = Date.now().toString().slice(-6);
  return `KS-F-${stamp}`;
}

router.post('/verify-enam', requireStage('otp_verified'), async (req, res, next) => {
  try {
    const { enamId } = req.body || {};
    const result = await lookupEnam(enamId);
    if (!result.ok) {
      const messages = {
        invalid_format: 'eNAM ID should look like EN followed by 8 digits.',
        not_found: 'No matching eNAM registration found.'
      };
      return res.status(404).json({ error: messages[result.reason] || 'Verification failed.' });
    }

    const alreadyClaimed = await Farmer.findOne({ enamId: result.profile.enamId });
    if (alreadyClaimed && alreadyClaimed.mobile !== req.auth.mobile) {
      return res.status(409).json({ error: 'This eNAM ID is already linked to another account.' });
    }

    return res.json({ ok: true, profile: result.profile });
  } catch (err) {
    return next(err);
  }
});

router.post('/register', requireStage('otp_verified'), async (req, res, next) => {
  try {
    const { enamId, village } = req.body || {};
    const result = await lookupEnam(enamId);
    if (!result.ok) {
      return res.status(400).json({ error: 'eNAM ID could not be re-verified. Start over.' });
    }

    const existing = await Farmer.findOne({ mobile: req.auth.mobile });
    if (existing) {
      return res.status(409).json({ error: 'This mobile number is already registered.' });
    }

    const farmer = await Farmer.create({
      farmerId: generateFarmerId(),
      mobile: req.auth.mobile,
      enamId: result.profile.enamId,
      name: result.profile.name,
      state: result.profile.state,
      mandi: result.profile.mandi,
      category: result.profile.category,
      village: village || ''
    });

    const token = signToken({
      mobile: farmer.mobile,
      stage: 'registered',
      farmerId: farmer.farmerId,
      farmerDbId: farmer._id.toString()
    }, '30d');

    return res.status(201).json({ ok: true, token, farmer });
  } catch (err) {
    return next(err);
  }
});

router.get('/me', requireStage('registered'), async (req, res, next) => {
  try {
    const farmer = await Farmer.findById(req.auth.farmerDbId);
    if (!farmer) return res.status(404).json({ error: 'Farmer not found.' });
    return res.json({ farmer });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
