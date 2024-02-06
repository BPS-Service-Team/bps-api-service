// Initializes the `wms-logs` service on path `/wms-logs`
const { WmsLogs } = require('./wms-logs.class');
const createModel = require('../../models/wms-logs.model');
const hooks = require('./wms-logs.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/wms-logs', new WmsLogs(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('wms-logs');

  service.hooks(hooks);
};
