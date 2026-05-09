// routes/event.routes.js
const express = require('express');
const validate = require('../../middlewares/validate');
const eventValidation = require('../../validations/event.validation');
const eventController = require('../../controllers/event.controller');
const { verifyToken } = require('../../middlewares/verify');
const { allowedMethod } = require('../../middlewares/headers');
const config = require('../../config/auth');
const { unAllowedMethod } = require('../../middlewares/method');
const { upload } = require('../../middlewares/upload');
const router = express.Router();

if (config.env === 'production') {
    // router.use(authLimiter);
}
router.use(allowedMethod);

// Public routes (no auth required)
router.route('/browse')
    .get(allowedMethod, eventController.getPublishedEvents)
    .all(unAllowedMethod);

router.route('/public/:shareId')
    .get(allowedMethod, eventController.getEventByShareId)
    .all(unAllowedMethod);

router.route('/:eventId/like')
    .post(allowedMethod, eventController.toggleLike)
    .all(unAllowedMethod);

router.route('/:eventId/like-status')
    .get(allowedMethod, eventController.getLikeStatus)
    .all(unAllowedMethod);

router.route('/:eventId/cancel')
    .patch(allowedMethod, verifyToken, eventController.cancelEvent)
    .all(unAllowedMethod);

// Protected routes (organizer only)
router.route('/')
    .post(allowedMethod, verifyToken, upload, validate(eventValidation.createEvent), eventController.createEvent)
    .get(allowedMethod, verifyToken, eventController.getMyEvents)
    .all(unAllowedMethod);

router.route('/:eventId')
    .get(allowedMethod, verifyToken, eventController.getEventById)
    .put(allowedMethod, verifyToken, upload, validate(eventValidation.updateEvent), eventController.updateEvent)
    .delete(allowedMethod, verifyToken, eventController.deleteEvent)
    .all(unAllowedMethod);

module.exports = router;