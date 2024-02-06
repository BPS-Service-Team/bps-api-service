// Initializes the `recalculation` service on path `/recalculation`
const { Recalculation } = require('./recalculation.class');
const hooks = require('./recalculation.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/recalculation', new Recalculation(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('recalculation');

  service.hooks(hooks);
};
