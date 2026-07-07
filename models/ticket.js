const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    eventTitle: {
      type: String,
      required: true
    },
    eventDate: {
      type: Date,
      required: true
    },
    eventTime: {
      type: String,
      required: true
    },
    eventVenue: {
      type: String,
      required: true
    },
    eventAddress: {
      type: String,
      default: ''
    },
    eventCity: {
      type: String,
      required: true
    },
    eventBannerImage: {
      type: String,
      default: ''
    },
    organizerName: {
      type: String,
      required: true
    },
    organizerPhone: {
      type: String,
      default: ''
    },
    organizerEmail: {
      type: String,
      required: true
    },
    ticketTierName: {
      type: String,
      required: true
    },
    ticketPrice: {
      type: Number,
      required: true
    },
    qrCodeDataUrl: { type: String },
    qrCodeUrl: { type: String },
    buyerName: {
      type: String,
      required: true
    },
    buyerEmail: {
      type: String,
      required: true,
      lowercase: true
    },
    buyerPhone: {
      type: String,
      default: ''
    },
    matriculationNumber: {
      type: String,
      default: '',
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    totalAmount: {
      type: Number,
      required: true
    },
    ticketCode: {
      type: String,
      unique: true,
      required: true
    },
    qrCodeDataUrl: {
      type: String,
      required: true
    },
    paymentReference: {
      type: String,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'success', 'failed', 'free'],
      default: 'pending'
    },
    purchaseDate: {
      type: Date, default: Date.now
    },
    // Check-in fields
    checkedIn: {
      type: Boolean,
      default: false
    },
    checkedInAt: {
      type: Date, default: null
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

ticketSchema.index({ ticketCode: 1 });
ticketSchema.index({ event: 1, checkedIn: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);