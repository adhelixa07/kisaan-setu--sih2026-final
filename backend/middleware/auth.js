const jwt = require('jsonwebtoken');
const env = require('../config/env');

const stageOrder = {
  otp_verified: 1,
  registered: 2,
  admin: 3,
  farmer: 2,
  buyer: 2
};

function signToken(payload, expiresIn = '30d') {
  return jwt.sign(payload, env.jwtSecret, { expiresIn });
}

function getBearerToken(req) {
  const raw = req.headers.authorization || req.headers.Authorization || '';
  return raw.startsWith('Bearer ') ? raw.slice(7) : raw || null;
}

function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ ok: false, message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    req.auth = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Invalid or expired token' });
  }
}

function requireStage(minStage = 'registered') {
  return (req, res, next) => {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ ok: false, message: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      const currentOrder = stageOrder[decoded.stage] || 0;
      const requiredOrder = stageOrder[minStage] || 0;
      if (currentOrder < requiredOrder) {
        return res.status(403).json({ ok: false, message: `This action requires a further verification step: ${minStage}` });
      }
      req.user = decoded;
      req.auth = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ ok: false, message: 'Invalid or expired token' });
    }
  };
}

function optionalAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    req.user = null;
    req.auth = null;
    return next();
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    req.auth = req.user;
  } catch (err) {
    req.user = null;
    req.auth = null;
  }

  return next();
}

module.exports = { requireAuth, optionalAuth, requireStage, signToken };
