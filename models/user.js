const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true
    },
    isBanned: {
      type: Boolean,
      default: false
    },
    
    password: {
      type: String,
      required: true
    },
    businessName: {
      type: String,
    },
    bio: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    },
   
    
    phoneNumber: {
      type: String,
    },
    
    
    wallet: {
      balance: {
        type: Number,
        default: 0,
        min: 0
      },
      availableBalance: {
        type: Number,
        default: 0,
        min: 0
      },
      pendingPayout: {
        type: Number,
        default: 0,
        min: 0
      },
      totalEarned: {
        type: Number,
        default: 0
      },
      transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
      }]
    },
    bankDetails: {
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      accountName: { type: String, default: '' },
    },
    events: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    }],
    totalEvents: {
      type: Number,
      default: 0
    },
    totalTicketsSold: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    
    
    verificationToken: String,
    verificationTokenExpiresAt: Date,
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
   
    
   
  },
  {
    timestamps: true
  }
);




module.exports = mongoose.model('User', userSchema);