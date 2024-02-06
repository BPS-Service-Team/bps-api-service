// Initializes the `agv-tasks` service on path `/agv-tasks`
const { AgvTasks } = require('./agv-tasks.class');
const createModel = require('../../models/agv-tasks.model');
const hooks = require('./agv-tasks.hooks');
const Utils = require('../../utils');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/agv-tasks', Utils.encapsulateBody, new AgvTasks(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('agv-tasks');

  service.hooks(hooks);
};
