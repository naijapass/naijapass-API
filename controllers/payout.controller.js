// controllers/payout.controller.js
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/user');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const Payout = require('../models/payout'); // Add this

// Get organizer's wallet balance and payout info
const getWalletBalance = catchAsync(async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('wallet bankDetails');
    
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: false,
        message: 'User not found'
      });
    }
    
    // Calculate next payout date (11 AM today or tomorrow)
    const now = new Date();
    const nextPayout = new Date();
    nextPayout.setHours(11, 0, 0, 0);
    
    if (now.getHours() >= 11) {
      nextPayout.setDate(nextPayout.getDate() + 1);
    }
    
    const wallet = user.wallet || {
      balance: 0,
      availableBalance: 0,
      pendingPayout: 0,
      totalEarned: 0
    };
    
    res.status(httpStatus.OK).json({
      status: true,
      data: {
        balance: wallet.balance || 0,
        availableBalance: wallet.availableBalance || 0,
        pendingPayout: wallet.pendingPayout || 0,
        totalEarned: wallet.totalEarned || 0,
        nextPayoutDate: nextPayout,
        nextPayoutAmount: wallet.availableBalance || 0
      }
    });
  } catch (error) {
    console.error('Error in getWalletBalance:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: error.message
    });
  }
});

// Get REAL payout history from database (NOT generated from tickets)
const getPayoutHistory = catchAsync(async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get ACTUAL payouts that were processed
    const realPayouts = await Payout.find({ organizer: userId })
      .sort({ createdAt: -1 });
    
    // Format payouts for frontend
    const payouts = realPayouts.map(payout => ({
      id: payout._id,
      amount: payout.amount,
      status: payout.status,
      date: payout.paidAt || payout.createdAt,
      method: 'Bank Transfer',
      accountDetails: payout.bankDetails?.bankName 
        ? `${payout.bankDetails.bankName} - ****${payout.bankDetails.accountNumber?.slice(-4)}` 
        : user?.bankDetails?.bankName 
          ? `${user.bankDetails.bankName} - ****${user.bankDetails.accountNumber?.slice(-4)}`
          : 'Bank account not set',
      eventName: 'Payout',
      eventId: 'payout',
      reference: payout.reference
    }));
    
    res.status(httpStatus.OK).json({
      status: true,
      data: payouts
    });
  } catch (error) {
    console.error('Error in getPayoutHistory:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: error.message
    });
  }
});

const processPayoutsManually = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  const user = await User.findById(userId);
  const amount = user.wallet.availableBalance;
  
  if (amount <= 0) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'No available balance to payout'
    });
  }
  
  if (!user.bankDetails?.accountNumber) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Please add bank details in settings first'
    });
  }
  
  // Create payout record
  const payout = await Payout.create({
    organizer: userId,
    amount: amount,
    status: 'pending',
    reference: `PAYOUT-${Date.now()}-${userId.toString().slice(-6)}`,
    bankDetails: user.bankDetails
  });
  
  // Deduct from wallet (mark as pending payout)
  user.wallet.availableBalance = 0;
  user.wallet.pendingPayout = amount;
  await user.save();
  
  res.status(httpStatus.OK).json({
    status: true,
    message: 'Payout request submitted. Will be processed at 11 AM.',
    data: payout
  });
});

module.exports = {
  getWalletBalance,
  getPayoutHistory,
  processPayoutsManually
};