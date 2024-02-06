const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label } = format;
require('winston-daily-rotate-file');
const PREFIX = process.env.CONFIG_PREFIX_COMPANY || '';

/**
 * Configure the Winston logger. For the complete documentation see https://github.com/winstonjs/winston
 * @description Logger for the Micro services backend status. 10 days of tracks
 * @example info
 * logger.info({
  *   level: 'info',
  *   message: 'Info Message',
  * });
  *
  * @example error
  * logger.error({
  *   level: 'error',
  *   message: 'Error Message',
  * });
  */
const logger = createLogger({
  level: 'info',
  format: combine(
    format.splat(),
    label({
      label: (PREFIX ? PREFIX + '-' : '') + 'api'
    }),
    timestamp(), format.json()
  ),
  exitOnError: false,
  transports: [
    new transports.DailyRotateFile({
      filename: './logs/%DATE%_error.log',
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      maxFiles: 10
    }),
    new transports.DailyRotateFile({
      filename: './logs/%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: 10
    }),
    new transports.Console({ colorize: true })
  ]
});

module.exports = logger;
