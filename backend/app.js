const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const { i18nMiddleware } = require('./i18n');

dotenv.config({ path: path.join(__dirname, '.env') });

const env = require('./config/env');
const connectDB = require('./config/db');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { initSocket } = require('./services/socket');
const { createUserFromRegistration, createListingFromFarm, createLoginSession } = require('./services/persistence');
const { signToken } = require('./middleware/auth');
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
app.use(i18nMiddleware);
if (env.nodeEnv !== 'test') {
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
}

// --- Static assets ---
app.use('/uploads', express.static(path.join(process.cwd(), env.storage.uploadDir)));
app.use('/i18n', express.static(path.join(__dirname, 'lang')));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.post('/api/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body || {};
    const result = await createLoginSession({
      emailOrPhone,
      password,
      ipAddress: req.ip || '',
      userAgent: req.get('User-Agent') || ''
    });

    if (!result.ok) {
      return res.status(401).json({ ok: false, message: result.message || 'Invalid credentials' });
    }

    const tokenPayload = {
      id: result.user?._id || result.user?.id || result.user?.phone,
      name: result.user?.name,
      email: result.user?.email,
      phone: result.user?.phone,
      role: result.user?.role || 'farmer',
      status: result.user?.status || 'pending',
      stage: result.user?.role === 'admin' ? 'registered' : 'registered'
    };
    const token = signToken(tokenPayload, '30d');

    return res.json({
      ok: true,
      user: result.user,
      token,
      session: result.session
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Login failed' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const payload = req.body || {};
    const result = await createUserFromRegistration({
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      password: payload.password,
      role: payload.role || 'farmer',
      village: payload.village,
      state: payload.state,
      district: payload.district,
      enamId: payload.enamId,
      farmName: payload.farmName,
      passwordHash: payload.passwordHash
    });

    if (!result.ok) {
      return res.status(409).json({ ok: false, message: result.message });
    }

    const token = signToken({
      id: result.user?._id || result.user?.id || result.user?.phone,
      name: result.user?.name,
      email: result.user?.email,
      phone: result.user?.phone,
      role: result.user?.role || payload.role || 'farmer',
      status: result.user?.status || 'pending',
      stage: 'registered'
    }, '30d');

    return res.json({ ok: true, user: result.user, token });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message || 'Registration failed' });
  }
});

app.post('/api/listings', async (req, res) => {
  try {
    const payload = req.body || {};
    const result = await createListingFromFarm({
      farmerId: payload.farmerId,
      userId: payload.userId,
      crop: payload.crop,
      category: payload.category,
      variety: payload.variety,
      quantity: payload.quantity,
      unit: payload.unit,
      price: payload.price,
      quality: payload.quality,
      harvest: payload.harvest,
      location: payload.location,
      details: payload.details
    });

    return res.json({ ok: true, data: result });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message || 'Listing failed' });
  }
});

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