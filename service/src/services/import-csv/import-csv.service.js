const multer = require('multer');
const path = require('path');

// Initializes the `import-csv` service on path `/import-csv`
const { ImportCsv } = require('./import-csv.class');
const hooks = require('./import-csv.hooks');

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, './public/uploads/');
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + path.extname(file.originalname));
  },
});

const accepted_extensions = ['csv', 'txt'];

const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // Max field value size `MB`,
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    // if the file extension is in our accepted list
    if (
      accepted_extensions.some((ext) => file.originalname.endsWith('.' + ext))
    ) {
      return cb(null, true);
    }

    // otherwise, return error
    return cb(
      new Error(
        'Invalid extension, only the following are allowed: ' + accepted_extensions.join(', ')
      )
    );
  },
});

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use(
    '/import-csv',
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

          req.body = body;
        }
      }

      next();
    },
    new ImportCsv(options, app)
  );

  // Get our initialized service so that we can register hooks
  const service = app.service('import-csv');

  service.hooks(hooks);
};
