// Initializes the `pallet-ready` service on path `/pallet-ready`
const { PalletReady } = require('./pallet-ready.class');
const hooks = require('./pallet-ready.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/pallet-ready', new PalletReady(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('pallet-ready');

  service.hooks(hooks);
};
