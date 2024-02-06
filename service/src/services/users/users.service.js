// Initializes the `users` service on path `/users`
const { Users } = require('./users.class');
const createModel = require('../../models/users.model');
const hooks = require('./users.hooks');
const uploadFiles = require('../../utils/uploadFiles');

const controller = uploadFiles.init(['jpg', 'jpeg', 'png', 'gif', 'tiff', 'mpg', 'mpeg', 'webm']);

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    whitelist: ['$regex', '$options'],
    custom_file_path: 'users/',
  };

  // Initialize our service with any options it requires
  app.use('/users',
    controller.upload.array('files'),
    uploadFiles.hookFiles,
    new Users(options, app)
  );

  // Get our initialized service so that we can register hooks
  const service = app.service('users');

  service.hooks(hooks);
};
