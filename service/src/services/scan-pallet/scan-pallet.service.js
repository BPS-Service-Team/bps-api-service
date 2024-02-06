// Initializes the `scan-pallet` service on path `/scan-pallet`
const { ScanPallet } = require('./scan-pallet.class');
const hooks = require('./scan-pallet.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/scan-pallet', new ScanPallet(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('scan-pallet');

  service.hooks(hooks);
};
