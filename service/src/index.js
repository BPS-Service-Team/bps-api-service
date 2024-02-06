/* eslint-disable no-console */
const logger = require('./logger');
const app = require('./app');
const port = app.get('port');
const server = app.listen(port);

process.on('unhandledRejection', (reason, _) =>
  logger.error('Fatal error: ' + reason.message || JSON.stringify(reason))
);

server.on('listening', () =>
  logger.info('Application started on http://%s:%d', app.get('host'), port)
);
