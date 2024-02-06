// Initializes the `agfs` service on path `/agfs`
const { authenticate } = require('@feathersjs/express');

const { Agfs } = require('./agfs.class');
const { AgfsStart } = require('./start/agfs-start.class');
const { AgfsCheck } = require('./check/agfs-check.class');
const { AgfsFinish } = require('./finish/agfs-finish.class');
const { AgfsStatus } = require('./status/agfs-status.class');
const { AgfsCancel } = require('./cancel/agfs-cancel.class');
const { AgfsForce } = require('./force/agfs-force.class');
const { AgfsRemove } = require('./remove/agf-remove.class');
const createModel = require('../../models/agfs.model');
const hooks = require('./agfs.hooks');
const Utils = require('../../utils');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/agfs', new Agfs(options, app));

  app.use(
    '/agfs/start',
    authenticate('jwt', 'api-key'),
    Utils.parseContext,
    Utils.encapsulateBody,
    new AgfsStart({ type: 'start' }, app)
  );

  app.use(
    '/agfs/check',
    authenticate('jwt', 'api-key'),
    Utils.parseContext,
    Utils.encapsulateBody,
    new AgfsCheck({ type: 'check' }, app)
  );

  app.use(
    '/agfs/finish',
    authenticate('jwt', 'api-key'),
    Utils.parseContext,
    Utils.encapsulateBody,
    new AgfsFinish({ type: 'finish' }, app)
  );

  app.use(
    '/agfs/cancel',
    authenticate('jwt', 'api-key'),
    Utils.parseContext,
    Utils.encapsulateBody,
    new AgfsFinish({ type: 'cancel' }, app)
  );

  app.use(
    '/agfs/wes/cancel',
    authenticate('jwt', 'api-key'),
    Utils.parseContext,
    new AgfsCancel({ type: 'cancel' }, app)
  );

  app.use(
    '/agfs/status',
    authenticate('jwt', 'api-key'),
    Utils.parseContext,
    new AgfsStatus({}, app)
  );

  app.use(
    '/agfs/force',
    authenticate('jwt', 'api-key'),
    Utils.parseContext,
    new AgfsForce({}, app)
  );

  app.use(
    '/agfs/delete',
    authenticate('jwt', 'api-key'),
    Utils.parseContext,
    new AgfsRemove({}, app)
  );

  // Get our initialized service so that we can register hooks
  const service = app.service('agfs');

  service.hooks(hooks);
};
