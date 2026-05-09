const express = require('express');
const validate = require('../../middlewares/validate');
const ticketValidation = require('../../validations/ticket.validation');
const ticketController = require('../../controllers/ticket.controller');
const { verifyToken } = require('../../middlewares/verify');
const { allowedMethod } = require('../../middlewares/headers');
const config = require('../../config/auth');
const { unAllowedMethod } = require('../../middlewares/method');
const router = express.Router();

if (config.env === 'production') {
    // router.use(authLimiter);
}
router.use(allowedMethod);

// Public routes (no auth required)
router.route('/create')
    .post(allowedMethod, validate(ticketValidation.createTicket), ticketController.createTicketAndSendEmail)
    .all(unAllowedMethod);

router.route('/:ticketId')
    .get(allowedMethod, ticketController.getTicket)
    .all(unAllowedMethod);

// Check-in route (public for QR scanning, but could be protected with API key)
router.route('/checkin/:ticketCode')
    .post(allowedMethod, ticketController.checkInAttendee)
    .all(unAllowedMethod);

// Protected routes (organizer only - require authentication)
router.route('/event/:eventId/tickets')
    .get(allowedMethod, verifyToken, ticketController.getEventTickets)
    .all(unAllowedMethod);

router.route('/checkin/:ticketCode')
    .post(allowedMethod, verifyToken, ticketController.checkInTicket)
    .all(unAllowedMethod);



module.exports = router;