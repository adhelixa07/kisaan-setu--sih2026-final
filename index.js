const mongoose = require('mongoose');
const connectDB = require('./db');
const models = require('./models');

module.exports = {
  connectDB,
  mongoose,
  models,
  ...models
};
