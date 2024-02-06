// Initializes the `valid` service on path `/valid`
const { Valid } = require('./valid.class');
const hooks = require('./valid.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/valid', new Valid(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('valid');

  service.hooks(hooks);
};
