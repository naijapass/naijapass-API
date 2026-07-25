// routes/admin.js

const express = require("express");
const { admit } = require("../../middlewares/permit");
const {
  bootstrapSuperadmin,
  createAdmin,
  loginAdmin,
  logoutAdmin,
  getDashboardStats,
  refreshTokens,
  getEvents,              // NEW
  getEventById,           // NEW
  updateEventStatus,      // NEW
  deleteEvent,            // NEW
  getTickets,             // NEW
  getTicketById,          // NEW
  updateTicketStatus,     // NEW
  getUsers,               // NEW
  getUserById,            // NEW
  updateUserBan,          // NEW
} = require("../../controllers/admin.controller");

const { allowedMethod } = require("../../middlewares/headers");
const { unAllowedMethod } = require("../../middlewares/method");
const { adminLimiter } = require("../../middlewares/rateLimiter");
const cache = require("../../utils/cache");
const config = require("../../config/auth");
const { verifyToken } = require('../../middlewares/verify');

const router = express.Router();

if (config.env === "production") {
  router.use(adminLimiter);
}

router.use(allowedMethod);

// ========== Public Routes ==========
router
  .route("/bootstrap-superadmin")
  .post(bootstrapSuperadmin)
  .all(unAllowedMethod);

router
  .route("/sign-in")
  .post(loginAdmin)
  .all(unAllowedMethod);

// ========== Protected Routes ==========
router
  .route("/logout")
  .post(cache.route(), logoutAdmin)
  .all(unAllowedMethod);

router
  .route('/refresh-tokens')
  .post(refreshTokens)
  .all(unAllowedMethod);

// Superadmin-only endpoints
router
  .route("/create")
  .post(verifyToken, admit("superadmin"), createAdmin)
  .all(unAllowedMethod);

// ========== Dashboard ==========
router
  .route('/stats')
  .get(cache.route(30), getDashboardStats)
  .all(unAllowedMethod);

// ========== Events ==========
router
  .route('/events')
  .get( getEvents)
  .all(unAllowedMethod);

router
  .route('/events/:id')
  .get( getEventById)
  .all(unAllowedMethod);

router
  .route('/events/:id/status')
  .patch( updateEventStatus)
  .all(unAllowedMethod);

router
  .route('/events/:id')
  .delete( deleteEvent)
  .all(unAllowedMethod);

// ========== Tickets ==========
router
  .route('/tickets')
  .get( getTickets)
  .all(unAllowedMethod);

router
  .route('/tickets/:id')
  .get( getTicketById)
  .all(unAllowedMethod);

router
  .route('/tickets/:id/status')
  .patch( updateTicketStatus)
  .all(unAllowedMethod);

// ========== Users ==========
router
  .route('/users')
  .get( getUsers)
  .all(unAllowedMethod);

router
  .route('/users/:id')
  .get( getUserById)
  .all(unAllowedMethod);

router
  .route('/users/:id/ban')
  .patch( updateUserBan)
  .all(unAllowedMethod);

module.exports = router;