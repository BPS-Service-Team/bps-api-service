// Initializes the `forgot` service on path `/forgot`
const { Forgot } = require('./forgot.class');
const hooks = require('./forgot.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/forgot', new Forgot(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('forgot');

  service.hooks(hooks);
};
