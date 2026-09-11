const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    fpoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FPO',
      index: true
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
      index: true
    },
    variety: {
      type: String,
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },
    unit: {
      type: String,
      enum: ['kg', 'quintal', 'ton', 'crate', 'bag', 'other'],
      default: 'kg'
    },
    pricePerUnit: {
      type: Number,
      required: [true, 'Price per unit is required'],
      min: [0, 'Price cannot be negative']
    },
    qualityGrade: {
      type: String,
      enum: ['A', 'B', 'C', 'premium', 'standard'],
      default: 'A'
    },
    harvestDate: {
      type: Date
    },
    location: {
      village: { type: String, trim: true },
      district: { type: String, trim: true, index: true },
      state: { type: String, trim: true, index: true },
      pincode: { type: String, trim: true }
    },
    status: {
      type: String,
      enum: ['available', 'sold', 'unlisted', 'archived'],
      default: 'available',
      index: true
    }
  },
  {
    timestamps: true
  }
);

productSchema.index({ name: 'text', category: 'text', variety: 'text' });

module.exports = mongoose.model('Product', productSchema);
