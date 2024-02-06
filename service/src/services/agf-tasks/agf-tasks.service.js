// Initializes the `agf-tasks` service on path `/agf-tasks`
const { AgfTasks } = require('./agf-tasks.class');
const createModel = require('../../models/agf-tasks.model');
const hooks = require('./agf-tasks.hooks');
const Utils = require('../../utils');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/agf-tasks', Utils.encapsulateBody, new AgfTasks(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('agf-tasks');

  service.hooks(hooks);
};
