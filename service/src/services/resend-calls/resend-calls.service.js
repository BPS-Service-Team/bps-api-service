// Initializes the `resend-calls` service on path `/resend-calls`
const { ResendCalls } = require('./resend-calls.class');
const hooks = require('./resend-calls.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/resend-calls', new ResendCalls(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('resend-calls');

  service.hooks(hooks);
};
