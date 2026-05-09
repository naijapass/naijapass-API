// routes/organizer/payout.routes.js
const express = require('express');
const { verifyToken } = require('../../middlewares/verify');
const { allowedMethod } = require('../../middlewares/headers');
const { unAllowedMethod } = require('../../middlewares/method');
const payoutController = require('../../controllers/payout.controller');

const router = express.Router();

router.use(allowedMethod);
router.use(verifyToken);

// Get wallet balance
router.route('/wallet')
    .get(allowedMethod, verifyToken, payoutController.getWalletBalance)
    .all(unAllowedMethod);

// Get payout history
router.route('/history')
    .get(allowedMethod, verifyToken, payoutController.getPayoutHistory)
    .all(unAllowedMethod);

module.exports = router;