// Initializes the `blacklist` service on path `/blacklist`
const { Blacklist } = require('./blacklist.class');
const createModel = require('../../models/blacklist.model');
const hooks = require('./blacklist.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/blacklist', new Blacklist(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('blacklist');

  service.hooks(hooks);
};
