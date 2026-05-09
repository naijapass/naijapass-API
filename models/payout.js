// models/Payout.js
const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  reference: {
    type: String,
    unique: true,
    required: true
  },
  bankDetails: {
    bankName: { type: String },
    accountNumber: { type: String },
    accountName: { type: String }
  },
  paidAt: {
    type: Date
  },
  transactionReference: {
    type: String
  },
  failureReason: {
    type: String
  },
  ticketsIncluded: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  }]
}, { timestamps: true });

// Index for faster queries
payoutSchema.index({ organizer: 1, status: 1 });
payoutSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payout', payoutSchema);