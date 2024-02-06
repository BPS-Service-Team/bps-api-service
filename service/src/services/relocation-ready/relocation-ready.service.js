// Initializes the `relocation-ready` service on path `/relocation-ready`
const { RelocationReady } = require('./relocation-ready.class');
const hooks = require('./relocation-ready.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/relocation-ready', new RelocationReady(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('relocation-ready');

  service.hooks(hooks);
};
