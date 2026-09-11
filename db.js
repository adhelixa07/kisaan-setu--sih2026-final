const mongoose = require('mongoose');
const env = require('../config/env');

let connectionPromise;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (connectionPromise) {
    return connectionPromise;
  }

  if (!env.mongoUri || env.mongoUri.trim() === '' || env.mongoUri.includes('<username>')) {
    const errorMsg =
      'MongoDB connection failed: MONGODB_URI is not configured in backend/.env. Please open backend/.env and replace the placeholder with your actual MongoDB Atlas connection string.';
    console.error(`\n[db error] ${errorMsg}\n`);
    throw new Error(errorMsg);
  }

  connectionPromise = mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000
  });

  try {
    await connectionPromise;
    const dbName = mongoose.connection.name;
    const host = mongoose.connection.host;
    console.log(`\n======================================================`);
    console.log(`[db] Successfully connected to MongoDB Atlas!`);
    console.log(`[db] Database Name: ${dbName}`);
    console.log(`[db] Host: ${host}`);
    console.log(`======================================================\n`);
    return mongoose.connection;
  } catch (error) {
    connectionPromise = undefined;
    console.error('\n======================================================');
    console.error('[db] MongoDB connection failed!');
    console.error('[db] Error message:', error.message);
    console.error('[db] Please check your:');
    console.error('     1. Network connection');
    console.error('     2. MongoDB Atlas Network Access (IP whitelist: 0.0.0.0/0 allowed)');
    console.error('     3. Database username and password in backend/.env');
    console.error('======================================================\n');
    throw error;
  }
}

module.exports = connectDB;
