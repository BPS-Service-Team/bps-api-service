const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const serveIndex = require('serve-index');
const axios = require('axios');
const fs = require('fs');

const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');

const logger = require('./logger');
const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');
const channels = require('./channels');
const authentication = require('./authentication');
const mongoose = require('./mongoose');
const bucket = require('./bucket');
const backup = require('./utils/backup');

const app = express(feathers());

// Load app configuration
app.configure(configuration());
// Enable security, CORS, compression, favicon and body parsing
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: '*',
  })
);
app.use(compress());
app.use(
  '/uploads',
  express.static(path.join(app.get('public'), 'uploads')),
  serveIndex(path.join(app.get('public'), 'uploads'), { icons: true })
);
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
// Host the public folder
app.use('/', express.static(app.get('public')));

// Configure the path to return a bucket resource
app.use('/upload', async (req, res) => {
  let src = fs.createReadStream(
    path.join(app.get('public'), 'img_bad_request.jpg')
  );

  try {
    const { target, token } = req.query,
      url = process.env.API_URL || false;

    let restring_role = process.env.CONFIG_BUCKET_RESTRING_ROLE || false;
    if (restring_role) {
      restring_role = restring_role.split(',');
    }

    // Check if target is present
    if (!target) {
      throw '[/GET upload] Target is not defined';
    }

    if (!url) {
      throw '[/GET upload] URL of the API is not defined';
    }

    if (target.indexOf('users') === 0) {
      let data,
        headers = {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method = 'POST',
        sPath = '/auth';

      if (token) {
        data = {
          strategy: 'jwt',
          accessToken: token,
        };
      } else if (req.headers['x-api-key']) {
        headers['x-api-key'] = req.headers['x-api-key'];
        sPath = '/valid';
        data = {};
      }

      if (data) {
        const response = await axios({
          method,
          url: url + sPath,
          headers,
          data,
        });

        if (response.status === 201 || response.status === 200) {
          const { user } = response.data;

          if (user) {
            let blnContinue = true;

            // We check that it is not within the restricted roles
            if (restring_role) {
              if (restring_role.indexOf(user.rol) > -1) {
                // If it is within the restricted roles, now we check that it owns the file
                if (target.indexOf(user._id) === -1) {
                  blnContinue = false;
                }
              }
            }

            if (blnContinue) {
              const multimedia = await axios({
                method: 'GET',
                url:
                  url +
                  '/multimedia?file_path=' +
                  target +
                  '&$select[]=file_type',
                headers: {
                  Accept: 'application/json',
                  Authorization: 'Bearer ' + token,
                },
              });

              if (multimedia.status === 200) {
                if (multimedia.data.total) {
                  res.setHeader(
                    'Content-type',
                    multimedia.data.data[0].file_type
                  );
                  const bucketClient = app.get('bucketClient');

                  if (bucketClient) {
                    src = bucketClient.conn
                      .getObject({
                        Bucket: bucketClient.config.name,
                        Key: `${bucketClient.config.prefix}${target}`,
                      })
                      .createReadStream();
                  }
                } else {
                  const bucketClient = app.get('bucketClient');

                  if (bucketClient) {
                    src = bucketClient.conn
                      .getObject({
                        Bucket: bucketClient.config.name,
                        Key: `${bucketClient.config.prefix}${target}`,
                      })
                      .createReadStream();
                  }
                }
              }
            }
          }
        }
      }
    } else {
      const bucketClient = app.get('bucketClient');

      if (bucketClient) {
        src = bucketClient.conn
          .getObject({
            Bucket: bucketClient.config.name,
            Key: `${bucketClient.config.prefix}${target}`,
          })
          .createReadStream();
      }
    }
  } catch (err) {
    logger.error('[/upload] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
  }

  src.on('error', (error) => {
    let img = fs.createReadStream(
      path.join(app.get('public'), 'img_not_found.jpg')
    );
    if (error.statusCode !== 404) {
      img = fs.createReadStream(
        path.join(app.get('public'), 'img_bad_request.jpg')
      );
    }

    img.pipe(res);
  });

  src.pipe(res);
});
//Set up backup service
app.use('/db-backup', async (req, res) => {
  if (!req.headers.authorization) {
    res
      .status(401)
      .send(JSON.stringify({ code: 401, message: 'Unauthorized' }));
  } else {
    let token = req.headers.authorization.split(' ')[1],
      data;
    if (token) {
      data = {
        strategy: 'jwt',
        accessToken: token,
      };
      try {
        const response = await app.service('auth').create(data),
          { user } = response;
        if (user?.rol === 'admin') {
          const DBClient = app.get('mongooseClient');
          const resBody = await backup.generateMongoInit(DBClient);
          res.setHeader('Content-type', 'text/javascript');
          res.send(resBody);
        } else {
          res.status(401).send({ status: 401, message: 'User not allowed!' });
        }
      } catch (error) {
        res.status(401).send({ status: 401, message: error.message });
      }
    } else {
      res.status(401).send({ status: 401, message: 'Unauthorized' });
    }
  }
});
// Set up Plugins and providers
app.configure(express.rest());
app.configure(
  socketio({
    path: '/ws/',
    origins: '*:*',
    handlePreflightRequest: (req, res) => {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST',
        'Access-Control-Allow-Credentials': true,
      });
      res.end();
    },
    allowRequest: (req, callback) => {
      const whitelist = process.env.CONFIG_WHITELIST_SITES;

      if (whitelist) {
        if (
          whitelist.split(',').indexOf(req.headers.origin) !== -1 ||
          !req.headers.origin
        ) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);

// Other setup for mongoose and the bucket
app.configure(mongoose);
app.configure(bucket);

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
app.configure(authentication);
// Set up our services (see `services/index.js`)
app.configure(services);
// Set up event channels (see channels.js)
app.configure(channels);
// Configure a middleware for 404s and the error handler
app.use(express.notFound());
app.use(express.errorHandler({ logger }));

app.hooks(appHooks);

module.exports = app;
