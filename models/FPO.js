const mongoose = require('mongoose');

const fpoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    organizationName: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      trim: true,
      index: true
    },
    district: {
      type: String,
      trim: true,
      index: true
    },
    state: {
      type: String,
      trim: true,
      index: true
    },
    address: {
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

module.exports = mongoose.model('FPO', fpoSchema);
