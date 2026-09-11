const mongoose = require('mongoose');
const env = require('./env');

let connectionPromise;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  if (!env.mongoUri || env.mongoUri.trim() === '' || env.mongoUri.includes('<username>')) {
    console.warn('[db] MongoDB URI is not configured; using in-memory fallback store.');
    return null;
  }

  connectionPromise = mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000
  });

  try {
    await connectionPromise;
    console.log(`[db] MongoDB connected to ${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (error) {
    connectionPromise = undefined;
    console.warn('[db] MongoDB connection warning; using in-memory fallback store.', error.message);
    return null;
  }
}

module.exports = connectDB;
