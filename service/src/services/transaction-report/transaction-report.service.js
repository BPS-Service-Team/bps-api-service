// Initializes the `transaction-report` service on path `/transaction-report`
const { TransactionReport } = require('./transaction-report.class');
const hooks = require('./transaction-report.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/transaction-report', new TransactionReport(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('transaction-report');

  service.hooks(hooks);
};
