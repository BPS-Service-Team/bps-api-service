// Initializes the `import-logs` service on path `/import-logs`
const { ImportLogs } = require('./import-logs.class');
const createModel = require('../../models/import-logs.model');
const hooks = require('./import-logs.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/import-logs', new ImportLogs(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('import-logs');

  service.hooks(hooks);
};
