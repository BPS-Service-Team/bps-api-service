// Initializes the `email-logs` service on path `/email-logs`
const { EmailLogs } = require('./email-logs.class');
const createModel = require('../../models/email-logs.model');
const hooks = require('./email-logs.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    whitelist: ['$regex', '$options'],
  };

  // Initialize our service with any options it requires
  app.use('/email-logs', new EmailLogs(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('email-logs');

  service.hooks(hooks);
};
