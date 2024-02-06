const { authenticate } = require('@feathersjs/express');

// Initializes the `agvs-2` service on path `/agvs-2`
const Utils = require('../../utils');
const hooks = require('./agvs.hooks');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Agvs } = require('./agvs.class');
const { AgvsFeedback } = require('./feedback/agvs-feedback.class');
const { AgvsReconciliation } = require('./reconciliation/agvs-reconciliation.class');
const i18n = require('../../utils/i18n');
const logger = require('../../logger');

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, './public/uploads/');
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + path.extname(file.originalname));
  }
});

const accepted_extensions = ['json'];

const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // Max field value size `MB`,
    files: 10
  },
  fileFilter: (req, file, cb) => {
    // if the file extension is in our accepted list
    if (accepted_extensions.some(ext => file.originalname.toLowerCase().endsWith('.' + ext))) {
      return cb(null, true);
    }

    // otherwise, return error
    return cb(
      new Error(
        i18n.render('multimedia_not_allowed', {
          accepted: accepted_extensions.join(', ')
        })
      )
    );
  }
});

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/agvs', new Agvs(options, app));

  app.use(
    '/agvs/feedback',
    authenticate('jwt', 'api-key'),
    Utils.parseContext,
    new AgvsFeedback({ type: 'feedback' }, app)
  );

  app.use(
    '/agvs/reconciliation',
    authenticate('jwt', 'api-key'),
    Utils.parseContext,
    upload.array('files'),
    async (req, _res, next) => {
      const { method } = req,
        body = {
          ...req.body,
          files: [],
        };

      if (method === 'POST') {
        if (req.files) {
          for (let file of req.files) {
            body.files.push({
              name: file.originalname,
              file_name: file.filename,
              file_path: file.path,
              file_type: file.mimetype,
            });
          }
          try {
            const oFileData = fs.readFileSync(
              path.join(__dirname, '../../../', body.files[0].file_path)
            );
            const oReco = JSON.parse(oFileData);
            req.body = oReco;
          } catch (e) {
            logger.error('[agvs/reconciliation] Error: %s', e.message || (typeof e === 'string' ? e : JSON.stringify(e)));
          }
        }
      }
      next();
    },
    new AgvsReconciliation({ type: 'feedback' }, app)
  );

  app.use(
    '/agvs/picking/feedback',
    authenticate('jwt', 'api-key'),
    Utils.parseContext,
    new AgvsFeedback({ type: 'pick-feedback' }, app)
  );

  // Get our initialized service so that we can register hooks
  const service = app.service('agvs');

  service.hooks(hooks);
};
