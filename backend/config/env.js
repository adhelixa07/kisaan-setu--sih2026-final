const path = require('path');

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb+srv://aritrak06_db_user:sih2026@cluster0.u0mojys.mongodb.net/?appName=Cluster0',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'local-demo-secret',
  storage: {
    uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
  }
};

module.exports = env;
