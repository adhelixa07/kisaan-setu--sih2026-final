const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    marketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Market',
      index: true
    },
    quantity: {
      type: Number,
      required: [true, 'Listing quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },
    minimumPrice: {
      type: Number,
      min: [0, 'Minimum price cannot be negative']
    },
    askingPrice: {
      type: Number,
      required: [true, 'Asking price is required'],
      min: [0, 'Asking price cannot be negative']
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'expired'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Listing', listingSchema);
