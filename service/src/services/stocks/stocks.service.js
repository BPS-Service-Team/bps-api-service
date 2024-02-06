const { authenticate } = require('@feathersjs/express');

// Initializes the `stocks` service on path `/stocks`
const { Stocks } = require('./stocks.class');
const { BalanceFind } = require('./balance/find.class');
const createModel = require('../../models/stocks.model');
const hooks = require('./stocks.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    // multi: ['patch'],
    paginate: app.get('paginate'),
    whitelist: ['$size', '$regex', '$options'],
  };

  // Initialize our service with any options it requires
  app.use('/stocks', new Stocks(options, app));

  app.use(
    '/api/stocks/wms',
    authenticate('jwt', 'api-key'),
    new BalanceFind({}, app),
  );

  // Get our initialized service so that we can register hooks
  const service = app.service('stocks');

  service.hooks(hooks);
};
