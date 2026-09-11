function notFound(req, res) {
  res.status(404).json({ ok: false, message: 'Resource not found' });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({ ok: false, message: err.message || 'Server error' });
}

module.exports = { notFound, errorHandler };
