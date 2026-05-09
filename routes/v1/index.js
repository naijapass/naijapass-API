const express = require('express');
const authRoute = require('./auth.route');
const httpStatus = require('http-status');
const cache = require('../../utils/cache');
const eventRoute = require('./event.route');
const ticketRoute = require('./ticket.route');
const { path } = require('../../app');
const payoutRoute = require('./payout.route');

const router = express.Router();


const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/payouts',
    route: payoutRoute,
  },
  {
    path: '/events',
    route: eventRoute,
  },
  {
    path: '/tickets',
    route: ticketRoute,
  }
  
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* GET home page. */
router.get('/', cache.route(), function(req, res, next) {
  res.status(httpStatus.OK).json({deployed: true});
});

module.exports = router;

