const debug = require('debug')('movie_smart:server');
const app = require('../app');
const http = require('http');
const config = require('../config/auth');
const logger = require('../config/logger');


const AWS = require('aws-sdk');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const normalizePort = (val) => {
  var port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

const exitHandler = () => {
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
};

const onError = (error) => {
  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
  switch (error.code) {
    case 'EACCES':
      logger.error(bind + ' requires elevated privileges');
      process.exit(1);
    case 'EADDRINUSE':
      logger.error(bind + ' is already in use');
      process.exit(1);
    default:
      throw error;
  }
};

const onListening = () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  debug('Listening on ' + bind);
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);
process.on('SIGTERM', () => {
  if (server) server.close();
});

const port = normalizePort(config.port || '7227');
app.set('port', port);

// Start server
const server = http.createServer(app);
server.listen(port, () => logger.info(`Listening on port ${port}`));
server.on('error', onError);
server.on('listening', onListening);







module.exports = {   };