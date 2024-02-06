// Initializes the `workstations` service on path `/workstations`
const { Workstations } = require('./pickup-zones.class');
const createModel = require('../../models/pickup-zones.model');
const hooks = require('./pickup-zones.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/pickup-zones', new Workstations(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('pickup-zones');

  service.hooks(hooks);
};
