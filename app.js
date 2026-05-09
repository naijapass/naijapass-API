const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const httpStatus = require('http-status');
const config = require('./config/auth');
const morgan = require('./config/morgan');
const { authLimiter } = require('./middlewares/rateLimiter');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const { jsonHeader } = require('./middlewares/headers');
const indexRouterV1 = require('./routes/v1/');
const cron = require('node-cron');
const Event = require('./models/Event');

const app = express();


cron.schedule('0 * * * *', async () => {
  console.log('Checking for expired events...');
  try {
    const now = new Date();
    const result = await Event.updateMany(
      {
        endDate: { $lt: now },
        status: { $in: ['published', 'draft'] }
      },
      { $set: { status: 'expired' } }
    );
    if (result.modifiedCount > 0) {
      console.log(` Updated ${result.modifiedCount} events to expired status`);
    }
  } catch (error) {
    console.error('Error updating expired events:', error);
  }
}, {
  timezone: "Africa/Lagos"
});



app.set('etag', false);
app.set('trust proxy', false);



const corsOptions = {
  origin: [
    'http://localhost:5173', 
    'https://dashboard.naijapass.com.ng',
    'https://naijapass.com.ng'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 // Some browsers choke on 204
};

// 1. FIRST: Enable CORS for all routes
app.use(cors(corsOptions));

// 2. SECOND: Handle preflight requests for all routes
app.options('/{*corsPreflight}', cors());

// 3. THEN: Add your other middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// use json for response
app.use(jsonHeader);

// different path for files
app.use('/filler', express.static(path.join(__dirname, 'public/uploads')));

// v1 routes
app.use('/v1.0', indexRouterV1);

// webhook route
app.post('/webhook/paystack', (req, res) => {
  const event = req.body;
  if (event.event === 'charge.success') {
    const tx = event.data;
    console.log(`Payment of ${tx.amount / 100} received from ${tx.customer.email}`);
  }
  res.sendStatus(200);
});

if (config.env !== 'production') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

// database sync
const { dB } = require('./models/index');

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'production' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
