// Initializes the `orders` service on path `/orders`
const { authenticate } = require('@feathersjs/express');

const { Orders } = require('./orders.class');
const { PutawaysCreate } = require('./putaways/create.class');
const { PutawaysCancel } = require('./putaways/cancel.class');
const { PutawaysForceFinish } = require('./putaways/force-finish.class');
const { ItemValidate } = require('./items/validate.class');
const { PickingsCreate } = require('./picking/create.class');
const { PickingsCalculate } = require('./picking/calculate.class');
const { PickingsProcessCalculate } = require('./picking/process-calculate');
const { PickingReady } = require('./picking/ready.class');
const { PickingsCancel } = require('./picking/cancel.class');
const { PickingRelease } = require('./picking/release.class');
const { RelocationCreate } = require('./relocation/create.class');
const { RelocationCancel } = require('./relocation/cancel.class');
const createModel = require('../../models/orders.model');
const hooks = require('./orders.hooks');
const Utils = require('../../utils');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/orders', new Orders(options, app));

  app.use(
    '/orders/putaway',
    authenticate('jwt', 'api-key'),
    Utils.parseContext,
    new PutawaysCreate({ type: 'putaway' }, app),
    Utils.checkErrorContext,
  );

  app.use(
    '/orders/putaway/force-finish',
    authenticate('jwt', 'api-key'),
    new PutawaysForceFinish({}, app),
    Utils.checkErrorContext,
  );

  app.use(
    '/orders/cancel/putaway',
    authenticate('jwt', 'api-key'),
    Utils.parseContext,
    new PutawaysCancel({ type: 'putaway' }, app),
    Utils.checkErrorContext,
  );

  app.use(
    '/orders/return',
    authenticate('jwt', 'api-key'),
    Utils.parseContext,
    new PutawaysCreate({ type: 'return' }, app),
    Utils.checkErrorContext,
  );

  app.use(
    '/orders/cancel/return',
    authenticate('jwt', 'api-key'),
    Utils.parseContext,
    new PutawaysCancel({ type: 'return' }, app),
    Utils.checkErrorContext,
  );

  app.use(
    '/orders/picking',
    authenticate('jwt', 'api-key'),
    Utils.parseContext,
    new PickingsCreate({}, app),
    Utils.checkErrorContext,
  );

  app.use(
    '/orders/picking/calculate',
    authenticate('jwt', 'api-key'),
    new PickingsCalculate({}, app),
  );

  app.use(
    '/orders/picking/process-calculate',
    authenticate('jwt', 'api-key'),
    new PickingsProcessCalculate({}, app),
  );

  app.use(
    '/orders/picking/ready',
    authenticate('jwt', 'api-key'),
    new PickingReady({}, app),
  );

  app.use(
    '/orders/cancel/picking',
    authenticate('jwt', 'api-key'),
    new PickingsCancel({}, app),
  );

  app.use(
    '/orders/picking/release',
    authenticate('jwt', 'api-key'),
    new PickingRelease({}, app),
  );

  app.use(
    '/orders/item/validate',
    authenticate('jwt', 'api-key'),
    Utils.parseContext,
    new ItemValidate({}, app),
  );

  app.use(
    '/orders/relocation',
    authenticate('jwt', 'api-key'),
    Utils.parseContext,
    new RelocationCreate({}, app),
  );

  app.use(
    '/orders/cancel/relocation',
    authenticate('jwt', 'api-key'),
    Utils.parseContext,
    new RelocationCancel({}, app),
  );

  // Get our initialized service so that we can register hooks
  const service = app.service('orders');

  service.hooks(hooks);
};
