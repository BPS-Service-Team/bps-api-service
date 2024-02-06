// Initializes the `utils` service on path `/utils`
const { Utils } = require('./utils.class');
const hooks = require('./utils.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/utils', new Utils(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('utils');

  service.hooks(hooks);
};
