// Initializes the `menus` service on path `/menus`
const { Menus } = require('./menus.class');
const createModel = require('../../models/menus.model');
const hooks = require('./menus.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    whitelist: ['$regex', '$options', '$short', '$parse'],
  };

  // Initialize our service with any options it requires
  app.use('/menus', new Menus(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('menus');

  service.hooks(hooks);
};
