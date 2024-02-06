// Initializes the `mail` service on path `/mail`
const { Mail } = require('./mail.class');
const hooks = require('./mail.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/mail', new Mail(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('mail');

  service.hooks(hooks);
};
