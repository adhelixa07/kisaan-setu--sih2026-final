const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Trust score sub-components are stored independently (0-100 each) so the
 * weighted total is deterministic and auditable. Never compute these ad hoc
 * on read - only trustScoreService.recalculate() may write to this block.
 */
const trustScoreSchema = new Schema(
  {
    reviews: { type: Number, min: 0, max: 100, default: 0 },
    identityVerification: { type: Number, min: 0, max: 100, default: 0 },
    farmVerification: { type: Number, min: 0, max: 100, default: 0 },
    fpoAuthorityVerification: { type: Number, min: 0, max: 100, default: 0 },
    transactionHistory: { type: Number, min: 0, max: 100, default: 0 },
    produceConsistency: { type: Number, min: 0, max: 100, default: 0 },
    locationConsistency: { type: Number, min: 0, max: 100, default: 0 },
    total: { type: Number, min: 0, max: 100, default: 0, index: true },
    lastCalculatedAt: { type: Date, default: null }
  },
  { _id: false }
);

const sellerProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    farmName: { type: String, trim: true, maxlength: 150 },
    location: {
      village: { type: String, trim: true },
      district: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      geo: {
        lat: { type: Number },
        lng: { type: Number }
      }
    },
    verification: {
      enamId: { type: String, trim: true },
      farmerRegistrationNumber: { type: String, trim: true },
      idProofUrl: { type: String },
      status: { type: String, enum: ['unsubmitted', 'pending', 'verified', 'rejected'], default: 'unsubmitted', index: true },
      rejectionReason: { type: String },
      submittedAt: { type: Date },
      reviewedAt: { type: Date }
    },
    trustScore: { type: trustScoreSchema, default: () => ({}) },
    totalSalesValue: { type: Number, default: 0 },
    completedOrderCount: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    reviewAverage: { type: Number, default: 0, min: 0, max: 5 }
  },
  { timestamps: true }
);

sellerProfileSchema.index({ 'location.district': 1, 'location.state': 1 });

module.exports = mongoose.model('SellerProfile', sellerProfileSchema);