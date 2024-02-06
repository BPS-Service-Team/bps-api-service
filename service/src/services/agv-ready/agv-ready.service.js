// Initializes the `agv-ready` service on path `/agv-ready`
const { AgvReady } = require('./agv-ready.class');
const hooks = require('./agv-ready.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/agv-ready', new AgvReady(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('agv-ready');

  service.hooks(hooks);
};
