// Initializes the `stock-report` service on path `/stock-report`
const { StockReport } = require('./stock-report.class');
const hooks = require('./stock-report.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/stock-report', new StockReport(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('stock-report');

  service.hooks(hooks);
};
