const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      index: true
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    bidPrice: {
      type: Number,
      required: [true, 'Bid price is required'],
      min: [0, 'Bid price cannot be negative']
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'countered', 'cancelled'],
      default: 'pending',
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Bid', bidSchema);
