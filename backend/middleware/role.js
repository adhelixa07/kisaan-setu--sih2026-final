function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ ok: false, message: 'Forbidden: insufficient role' });
    }
    return next();
  };
}

module.exports = { requireRole };
