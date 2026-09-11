const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Market name is required'],
      trim: true,
      index: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      index: true
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
      index: true
    },
    address: {
      type: String,
      trim: true
    },
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Market', marketSchema);
