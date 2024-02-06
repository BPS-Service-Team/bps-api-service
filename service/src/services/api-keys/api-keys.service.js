// Initializes the `api-keys` service on path `/api-keys`
const { ApiKeys } = require('./api-keys.class');
const createModel = require('../../models/api-keys.model');
const hooks = require('./api-keys.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/api-keys', new ApiKeys(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('api-keys');

  service.hooks(hooks);
};
