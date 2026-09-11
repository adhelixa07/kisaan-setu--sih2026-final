const mongoose = require('mongoose');
const env = require('../config/env');
const connectDB = require('./db');

console.log('--- Testing MongoDB Atlas Connection for Kisaan Setu ---');

if (!env.mongoUri || env.mongoUri.includes('<username>')) {
  console.log('\n[INFO] Please open backend/.env and replace:');
  console.log('       MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/...');
  console.log('       with your actual MongoDB Atlas connection string.\n');
  process.exit(1);
}

connectDB()
  .then(async () => {
    console.log('[SUCCESS] Database connected successfully!');
    console.log('[SUCCESS] Verifying collection read permissions...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`[SUCCESS] Found ${collections.length} existing collections in database:`);
    collections.forEach(c => console.log(`   - ${c.name}`));
    console.log('\nAll checks passed! Your MongoDB Atlas cluster is ready for Kisaan Setu.\n');
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('\n[TEST FAILED] Connection test failed with error:');
    console.error(err.message);
    process.exit(1);
  });
