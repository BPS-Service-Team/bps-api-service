const multer = require('multer');
const path = require('path');

// Initializes the `multimedia` service on path `/multimedia`
const { Multimedia } = require('./multimedia.class');
const createModel = require('../../models/multimedia.model');
const hooks = require('./multimedia.hooks');
const i18n = require('../../utils/i18n');

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, './public/uploads/');
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + path.extname(file.originalname));
  }
});

const accepted_extensions = [
  'jpg', 'jpeg', 'png', 'gif', 'tiff', 'mp4', 'wma', 'wav', 'mpg',
  'mpeg', 'webm', 'pdf', 'doc', 'docx', 'xls', 'xlsx',
  'ppt', 'pptx', 'txt'
];
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
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: ['create'],
    whitelist: ['$regex', '$options']
  };

  // Initialize our service with any options it requires
  app.use('/multimedia',
    upload.array('files'),
    async (req, _res, next) => {
      const { method } = req,
        body = {
          ...req.body,
          files: []
        };

      if (method === 'POST') {
        if (req.files) {
          for (let file of req.files) {
            body.files.push({
              name: file.originalname,
              file_name: file.filename,
              file_path: file.path,
              file_type: file.mimetype
            });
          }

          req.body = body;
        }
      }

      next();
    },
    new Multimedia(options, app)
  );

  // Get our initialized service so that we can register hooks
  const service = app.service('multimedia');

  service.hooks(hooks);
};
