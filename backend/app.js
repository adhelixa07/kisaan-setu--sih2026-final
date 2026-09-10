const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const connectDB = require('./config/db');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { initSocket } = require('./services/socket');

const app = express();

// --- Core middleware ---
app.use(
  helmet({
    contentSecurityPolicy: false // relaxed for a static Bootstrap frontend served from the same origin
  })
);
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (env.nodeEnv !== 'test') {
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
}

// --- Static assets ---
app.use('/uploads', express.static(path.join(process.cwd(), env.storage.uploadDir)));
app.use('/i18n', express.static(path.join(__dirname, 'lang')));
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- API ---
app.use('/api', apiRoutes);

// --- SPA-ish fallback for direct navigation to a client route that isn't a static file/API call ---
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  if (path.extname(req.path)) return next(); // let express.static 404 on missing real assets
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
initSocket(server);

if (require.main === module) {
  connectDB().then(() => {
    server.listen(env.port, () => {
      console.log(`[server] Kisaan Setu API + frontend running on http://localhost:${env.port}`);
    });
  });
}

module.exports = { app, server };