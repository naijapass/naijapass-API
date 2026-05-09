// controllers/auth.controller.js
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { tokenService } = require('../services');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { sendMagicLinkEmail, sendOrganizerWelcomeEmail } = require('../services/email.service');
const axios = require('axios');
// Login
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Email and password are required'
    });
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      status: false,
      message: 'Invalid email or password'
    });
  }

  if (user.isBanned) {
    return res.status(httpStatus.FORBIDDEN).json({
      status: false,
      message: 'Your account has been banned'
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      status: false,
      message: 'Invalid email or password'
    });
  }

  user.lastLogin = new Date();
  await user.save();

  const tokens = await tokenService.generateAuthTokens(user);

  const safeUser = user.toObject();
  delete safeUser.password;
  delete safeUser.__v;

  res.status(httpStatus.OK).json({
    status: true,
    message: 'Login successful',
    data: { user: safeUser, tokens }
  });
});

const registerOrganizer = catchAsync(async (req, res) => {
  const { email, password, fullName, businessName, phoneNumber } = req.body;

  if (!email || !password || !fullName) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'All required fields must be filled'
    });
  }

  // Password validation
  if (password.length < 8) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Password must be at least 8 characters long'
    });
  }

  if (!/[A-Z]/.test(password)) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Password must contain at least one uppercase letter'
    });
  }

  if (!/[a-z]/.test(password)) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Password must contain at least one lowercase letter'
    });
  }

  if (!/[0-9]/.test(password)) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Password must contain at least one number'
    });
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Password must contain at least one special character'
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(httpStatus.CONFLICT).json({
      status: false,
      message: 'User with this email already exists'
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
    businessName: businessName || '',
    phoneNumber: phoneNumber || '',
  });

  // Generate tokens
  const tokens = await tokenService.generateAuthTokens(user);

  // Send welcome email with dashboard URL
  try {
    const dashboardUrl = `${process.env.FRONTEND_URL}/organizer/dashboard`;
    await sendOrganizerWelcomeEmail(email, {
      name: fullName,
      year: new Date().getFullYear(),
      dashboardUrl: dashboardUrl
    });
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }

  const safeUser = user.toObject();
  delete safeUser.password;
  delete safeUser.__v;

  res.status(httpStatus.CREATED).json({
    status: true,
    message: 'Organizer account created successfully',
    data: { user: safeUser, tokens }
  });
});

// Logout
const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Delete refresh token from database
    await tokenService.deleteRefreshToken(refreshToken);
  }

  res.status(httpStatus.NO_CONTENT).send();
});

// Refresh Tokens
const refreshTokens = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await tokenService.refreshAuth(refreshToken);
  res.send({ ...tokens });
});

// Send magic link for password reset
const sendMagicLink = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Email is required'
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(httpStatus.OK).json({
      status: true,
      message: 'If an account exists, you will receive a magic link'
    });
  }

  // Generate reset password token using token service
  const resetToken = await tokenService.generateResetPasswordToken(email);

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

  try {
    await sendMagicLinkEmail(email, {
      name: user.fullName,
      magicLink: resetUrl,
      expiryMinutes: 15
    });

    res.status(httpStatus.OK).json({
      status: true,
      message: 'Magic link sent to your email'
    });
  } catch (err) {
    console.error('Failed to send magic link:', err);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: 'Failed to send magic link'
    });
  }
});

// Reset password using magic link
const resetPassword = catchAsync(async (req, res) => {
  const { token, email, password, confirmPassword } = req.body;

  if (!token || !email || !password || !confirmPassword) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'All fields are required'
    });
  }

  if (password !== confirmPassword) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Passwords do not match'
    });
  }

  if (password.length < 6) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Password must be at least 6 characters'
    });
  }

  // Verify token using token service
  const tokenDoc = await tokenService.verifyToken(token, 'RESET_PASSWORD');

  const user = await User.findById(tokenDoc.user);

  if (!user || user.email !== email) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Invalid or expired magic link'
    });
  }

  // Update password
  user.password = await bcrypt.hash(password, 10);
  await user.save();

  // Delete the used token
  await tokenDoc.deleteOne();

  res.status(httpStatus.OK).json({
    status: true,
    message: 'Password reset successfully'
  });
});

// Change Password (for logged in users)
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user.id;

  // Check if all fields are provided
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'All fields are required'
    });
  }

  // Check if new password matches confirm password
  if (newPassword !== confirmPassword) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'New passwords do not match'
    });
  }

  // Check password length
  if (newPassword.length < 6) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Password must be at least 6 characters'
    });
  }

  const user = await User.findById(userId).select('+password');

  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: false,
      message: 'User not found'
    });
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Current password is incorrect'
    });
  }

  // Check if new password is the same as old password
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'New password cannot be the same as your current password'
    });
  }

  // Hash and save new password
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.status(httpStatus.OK).json({
    status: true,
    message: 'Password changed successfully'
  });
});

// Get Profile
const getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -__v');

  res.status(httpStatus.OK).json({
    status: true,
    data: user
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const updates = req.body;

  // Remove fields that shouldn't be updated
  delete updates.email;
  delete updates.password;
  delete updates._id;
  delete updates.id;

  // Filter out undefined values but keep empty strings
  const updateData = {};
  const allowedFields = ['fullName', 'phoneNumber', 'businessName', 'bio', 'website', 'address', 'city', 'state'];

  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      // Allow empty strings to be saved
      updateData[field] = updates[field] === '' ? '' : updates[field];
    }
  });

  // Update with runValidators: false to bypass empty string validation
  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    {
      new: true,
      runValidators: false  // Disable validators for optional fields
    }
  ).select('-password -__v -verificationToken -resetPasswordToken');

  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: false,
      message: 'User not found'
    });
  }

  res.status(httpStatus.OK).json({
    status: true,
    message: 'Profile updated successfully',
    data: user
  });
});

// Delete Account
const deleteAccount = catchAsync(async (req, res) => {
  await User.findByIdAndDelete(req.user.id);

  res.status(httpStatus.OK).json({
    status: true,
    message: 'Account deleted successfully'
  });
});

const getBankAccount = catchAsync(async (req, res) => {
  const organizerId = req.user.id;

  const user = await User.findById(organizerId).select('bankDetails');

  res.status(httpStatus.OK).json({
    status: true,
    data: user?.bankDetails || null
  });
});

// Verify bank account with Paystack
const verifyBankAccount = catchAsync(async (req, res) => {
  const { accountNumber, bankCode } = req.body;

  if (!accountNumber || !bankCode) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Account number and bank code are required'
    });
  }

  try {
    // Call Paystack API to verify account
    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    if (response.data.status) {
      return res.status(httpStatus.OK).json({
        status: true,
        data: {
          accountName: response.data.data.account_name,
          accountNumber: response.data.data.account_number,
          bankCode: bankCode
        }
      });
    } else {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: false,
        message: response.data.message || 'Unable to verify account'
      });
    }
  } catch (error) {
    console.error('Paystack verification error:', error.response?.data || error.message);
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: error.response?.data?.message || 'Failed to verify account. Please check the account number and try again.'
    });
  }
});

// Save organizer's bank account
const saveBankAccount = catchAsync(async (req, res) => {
  const organizerId = req.user.id;
  const { bankName, bankCode, accountNumber, accountName } = req.body;

  if (!bankName || !accountNumber || !accountName) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Bank name, account number and account name are required'
    });
  }

  // Update user's bankDetails
  const user = await User.findByIdAndUpdate(
    organizerId,
    {
      bankDetails: {
        bankName,
        accountNumber,
        accountName
      }
    },
    { new: true }
  ).select('bankDetails');

  res.status(httpStatus.OK).json({
    status: true,
    message: 'Bank account saved successfully',
    data: user?.bankDetails
  });
});

module.exports = {
  login,
  registerOrganizer,
  logout,
  refreshTokens,
  sendMagicLink,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
  deleteAccount,
  getBankAccount,
  verifyBankAccount,
  saveBankAccount
};