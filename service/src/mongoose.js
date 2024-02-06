const mongoose = require('mongoose');
const logger = require('./logger');
const data = require('./data');
const fs = require('fs');
const MAX_RETRIES = 15, TIME_RECONNECTION = 3000;

let sConnection = '', iRetries = 0;

module.exports = function (app) {
  let host = process.env.MONGODB_ADVERTISED_HOSTNAME,
    db = process.env.MONGODB_DATABASE,
    username = process.env.MONGODB_USERNAME,
    password = process.env.MONGODB_PASSWORD,
    port = process.env.MONGODB_PORT || '',
    auth_db = process.env.MONGODB_AUTH_DATABASE || 'admin',
    protocol = process.env.MONGODB_PROTOCOL || 'mongodb+srv', // +srv Only with Mongo Atlas
    ssl = process.env.MONGODB_SSL || false, // For secure connections
    replicated = process.env.MONGODB_REPLICA_SET_NAME || false, // Replicated set
    preference = process.env.MONGODB_READ_PREFERENCE || false,
    tls_file_path = process.env.MONGODB_TLS_SERVER_VALIDATION || false,
    options = {
      serverSelectionTimeoutMS: 5000,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

  sConnection = `${protocol}://${username}:${password}@${host}${
    port !== '' ? ':' + port : ''
  }/${db}?authSource=${auth_db}&ssl=${ssl}&retryWrites=true&w=majority${
    replicated ? `&replicaSet=${replicated}` : ''
  }${
    preference ? `&readPreference=${preference}` : ''
  }`;
  sConnection = sConnection.replace(/\s+/gi, '').trim();

  if (tls_file_path) {
    if (fs.existsSync(tls_file_path)) {
      options = {
        ...options,
        sslValidate: true,
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsCAFile: tls_file_path,
      };
    } else {
      logger.warn(`[mongoose] Couldn't find certificate client authority file on next route '${tls_file_path}'`);
      process.exit(1);
    }
  }

  const connect = () => {
    iRetries++;
    mongoose.connect(sConnection, options);
  };

  connect();
  mongoose.connection.on('connected', () => {
    iRetries = 0;
    data.init(app, mongoose);
    logger.info('[mongoose] Successfully connected to the database.');
  });

  mongoose.connection.on('error', err => {
    if (iRetries < MAX_RETRIES) {
      setTimeout(connect, TIME_RECONNECTION);
    } else {
      logger.error('[mongoose] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
      process.exit(1);
    }
  });

  mongoose.connection.on('disconnected', () => {
    if (iRetries < MAX_RETRIES) {
      setTimeout(connect, TIME_RECONNECTION);
    }
  });

  mongoose.Promise = global.Promise;

  app.set('mongooseClient', mongoose);
};
