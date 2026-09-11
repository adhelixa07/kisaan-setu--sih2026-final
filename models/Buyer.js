const mongoose = require('mongoose');

const buyerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    buyerType: {
      type: String,
      enum: ['trader', 'distributor', 'retailer', 'processor', 'individual', 'other'],
      default: 'trader'
    },
    companyName: {
      type: String,
      trim: true
    },
    gstNumber: {
      type: String,
      trim: true
    },
    businessAddress: {
      type: String,
      trim: true
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Buyer', buyerSchema);
