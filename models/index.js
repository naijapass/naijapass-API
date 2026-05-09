const mongoose = require("mongoose")
const { mongooseP } = require('../config/auth');
const logger = require('../config/logger');
const token = require('./token');
const user = require('./user');

const mongooseInstance = mongoose.connect(mongooseP.url);
const dB = {};

mongooseInstance
  .then(() => {
    logger.info('Database is good');
  })
  .catch(err => {
    logger.error('Database connection error', err);
    throw new Error(`Config validation error: ${err.message}`);
  });

dB.mongo = mongooseInstance;

dB.tokens = token;
dB.users = user;


module.exports = {
  dB
};
