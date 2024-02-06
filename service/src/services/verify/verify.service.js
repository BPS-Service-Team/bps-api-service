// Initializes the `verify` service on path `/verify`
const { Verify } = require('./verify.class');
const hooks = require('./verify.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/verify', new Verify(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('verify');

  service.hooks(hooks);
};
