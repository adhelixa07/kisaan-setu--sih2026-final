const jwt = require("jsonwebtoken");

// Two token "stages" gate the registration funnel:
//   otp_verified -> may call /api/farmers/verify-enam and /api/farmers/register
//   registered   -> may call /api/orders and /api/payments
// This stops someone who only verified an OTP from skipping straight to
// placing orders under someone else's identity.
function requireAuth(minStage) {
  const order = { otp_verified: 1, registered: 2 };

  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Missing bearer token." });
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (order[payload.stage] < order[minStage]) {
        return res.status(403).json({ error: "This action requires a further verification step." });
      }
      req.auth = payload;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }
  };
}

function signToken(payload, expiresIn) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

module.exports = { requireAuth, signToken };
