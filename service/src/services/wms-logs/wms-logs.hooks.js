const { authenticate } = require('@feathersjs/authentication').hooks;
const validate = require('@feathers-plus/validate-joi');
const { disallow } = require('feathers-hooks-common');

const joiOptions = require('../../utils/joi.options').options();
const Schema = require('../../schemas/wms-logs.schema');
const logger = require('../../logger');

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [],
    create: [disallow('rest'), validate.form(Schema.POST_SCHEMA, joiOptions)],
    update: [disallow()],
    patch: [disallow('rest'), validate.form(Schema.PATCH_SCHEMA, joiOptions)],
    remove: [disallow('rest')],
  },

  after: {
    all: [],
    find: [
      async context => {
        const { result } = context;

        const aAGVs = result.data
          .filter(oItem => oItem.command === 'agvs/create')
          .map(oItem => oItem.order_id);
        if (aAGVs.length) {
          const aTasks = await context.app.service('agv-tasks').find({
            query: {
              order_id: {
                $in: aAGVs,
              },
              $select: ['receipt_code', 'status', 'order_id'],
            },
          });

          for (const oTask of aTasks.data) {
            const aRows = result.data.filter(
              oItem => oItem.order_id === oTask.order_id &&
              oItem.command === 'agvs/create'
            );
            for (let oRow of aRows) {
              oRow.task = oTask;
            }
          }
        }

        return context;
      },
    ],
    get: [],
    create: [
      async context => {
        if (context.data) {
          logger.info('[POST /wms-logs] Info: %s', JSON.stringify(context.data));
        }
      },
    ],
    update: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
};
