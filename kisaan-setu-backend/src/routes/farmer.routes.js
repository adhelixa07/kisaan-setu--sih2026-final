const express = require("express");
const Farmer = require("../models/Farmer");
const { lookupEnam } = require("../utils/enamMock");
const { requireAuth, signToken } = require("../middleware/auth");

const router = express.Router();

function generateFarmerId() {
  const stamp = Date.now().toString().slice(-6);
  return `KS-F-${stamp}`;
}

// POST /api/farmers/verify-enam  { enamId }
// Requires an otp_verified (or registered) token — you must own the phone
// number before you're allowed to query the eNAM registry through us.
router.post("/verify-enam", requireAuth("otp_verified"), async (req, res, next) => {
  try {
    const { enamId } = req.body;
    const result = await lookupEnam(enamId);
    if (!result.ok) {
      const messages = {
        invalid_format: "eNAM ID should look like EN followed by 8 digits.",
        not_found: "No matching eNAM registration found.",
      };
      return res.status(404).json({ error: messages[result.reason] || "Verification failed." });
    }

    // Guard against someone registering an eNAM ID that's already claimed
    // by a different account.
    const alreadyClaimed = await Farmer.findOne({ enamId: result.profile.enamId });
    if (alreadyClaimed && alreadyClaimed.mobile !== req.auth.mobile) {
      return res.status(409).json({ error: "This eNAM ID is already linked to another account." });
    }

    res.json({ ok: true, profile: result.profile });
  } catch (err) {
    next(err);
  }
});

// POST /api/farmers/register  { enamId, village }
// Re-verifies the eNAM ID server-side (never trust a profile object the
// client could have edited) and creates the Farmer document.
router.post("/register", requireAuth("otp_verified"), async (req, res, next) => {
  try {
    const { enamId, village } = req.body;
    const result = await lookupEnam(enamId);
    if (!result.ok) {
      return res.status(400).json({ error: "eNAM ID could not be re-verified. Start over." });
    }

    const existing = await Farmer.findOne({ mobile: req.auth.mobile });
    if (existing) {
      return res.status(409).json({ error: "This mobile number is already registered." });
    }

    const farmer = await Farmer.create({
      farmerId: generateFarmerId(),
      mobile: req.auth.mobile,
      enamId: result.profile.enamId,
      name: result.profile.name,
      state: result.profile.state,
      mandi: result.profile.mandi,
      category: result.profile.category,
      village: village || "",
    });

    const token = signToken(
      { mobile: farmer.mobile, stage: "registered", farmerId: farmer.farmerId, farmerDbId: farmer._id.toString() },
      "30d"
    );

    res.status(201).json({ ok: true, token, farmer });
  } catch (err) {
    next(err);
  }
});

// GET /api/farmers/me
router.get("/me", requireAuth("registered"), async (req, res, next) => {
  try {
    const farmer = await Farmer.findById(req.auth.farmerDbId);
    if (!farmer) return res.status(404).json({ error: "Farmer not found." });
    res.json({ farmer });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
