function notFound(req, res) {
  res.status(404).json({ error: `No route: ${req.method} ${req.path}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({ error: `That ${field} is already registered.` });
  }
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Something went wrong." });
}

module.exports = { notFound, errorHandler };
