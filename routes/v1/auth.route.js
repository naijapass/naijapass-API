// routes/organizer/auth.routes.js
const express = require('express');
const validate = require('../../middlewares/validate');
const authValidation = require('../../validations/auth.validation');
const authController = require('../../controllers/auth.controller');
const { verifyToken } = require('../../middlewares/verify');
const { authLimiter } = require('../../middlewares/rateLimiter');
const { allowedMethod } = require('../../middlewares/headers');
const config = require('../../config/auth');
const { unAllowedMethod } = require('../../middlewares/method');

const router = express.Router();

if (config.env === 'production') {
    router.use(authLimiter);
}
router.use(allowedMethod);

// Register Organizer
router.route('/register')
    .post(allowedMethod, validate(authValidation.registerOrganizer), authController.registerOrganizer)
    .all(unAllowedMethod);

// Login Organizer
router.route('/login')
    .post(allowedMethod, validate(authValidation.login), authController.login)
    .all(unAllowedMethod);

// Logout
router.route('/logout')
    .post(allowedMethod, authController.logout)
    .all(unAllowedMethod);

// Refresh Tokens
router.route('/refresh-tokens')
    .post(allowedMethod, validate(authValidation.refreshTokens), authController.refreshTokens)
    .all(unAllowedMethod);

// Forgot Password (Send Magic Link)
router.route('/forgot-password')
    .post(allowedMethod, validate(authValidation.forgotPassword), authController.sendMagicLink)
    .all(unAllowedMethod);

// Reset Password (via Magic Link)
router.route('/reset-password')
    .post(allowedMethod, validate(authValidation.resetPassword), authController.resetPassword)
    .all(unAllowedMethod);

// Change Password (Logged in user)
router.route('/change-password')
    .post(allowedMethod, verifyToken, validate(authValidation.changePassword), authController.changePassword)
    .all(unAllowedMethod);

// Get Profile
router.route('/profile')
    .get(allowedMethod, verifyToken, authController.getProfile)
    // Update Profile
    .put(allowedMethod, verifyToken, validate(authValidation.updateProfile), authController.updateProfile)
    .all(unAllowedMethod);

// Delete Account
router.route('/delete')
    .delete(allowedMethod, verifyToken, authController.deleteAccount)
    .all(unAllowedMethod);

router.route('/bank-account')
    .get(allowedMethod, verifyToken, authController.getBankAccount)
    .all(unAllowedMethod);

// Verify Bank Account with Paystack
router.route('/verify-bank-account')
    .post(allowedMethod, verifyToken, authController.verifyBankAccount)
    .all(unAllowedMethod);

// Save Bank Account
router.route('/save-bank-account')
    .post(allowedMethod, verifyToken, authController.saveBankAccount)
    .all(unAllowedMethod);

module.exports = router;