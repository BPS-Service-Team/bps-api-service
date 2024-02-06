const { authenticate } = require('@feathersjs/authentication').hooks;
const validate = require('@feathers-plus/validate-joi');
const { disallow } = require('feathers-hooks-common');
const errors = require('@feathersjs/errors');

const joiOptions = require('../../utils/joi.options').options();
const Schema = require('../../schemas/pickup-zones.schema');

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [],
    create: [validate.form(Schema.POST_SCHEMA, joiOptions)],
    update: [disallow()],
    patch: [validate.form(Schema.PATCH_SCHEMA, joiOptions)],
    remove: [],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [
      async context => {
        const { data, params } = context;
        const { order_id, pallet_id } = data;
        const { user } = params;

        if (order_id && pallet_id) {
          let aStocks = [];

          // Validate the size pallet
          let sSize = pallet_id[0],
            sStockLabel = '';

          if (['L', 'S'].indexOf(sSize) === -1) {
            throw new errors.BadRequest(
              `The size "${sSize}" of pallet "${pallet_id}" is not allowed`
            );
          }

          // Find is the pallet Id already exists into stocks
          let aExists = await context.app.service('stocks').find({
              query: {
                pallet_id: pallet_id
              }
            }),
            aOrder = await context.app.service('orders').find({
              query: {
                order_id,
              },
            }),
            order = aOrder.data[0];

          if (!order) {
            throw new errors.BadRequest(
              `Order with ID "${order_id}" does not exist`
            );
          }

          if (!aExists.total) {
            throw new errors.BadRequest('The pallet doesn\'t exist in stock.');
          } else {
            const [first] = aExists.data;
            aStocks = first.stocks || [];
            sStockLabel = first.label;
          }

          let sTaskId = `T${new Date().getTime()}`;
          let oAgfRequest = {
            order_id,
            task_no: sTaskId,
            type: 'create',
            request: aStocks.map(oStock => ({
              BATCH_NO: oStock.BATCH_NO,
              ITM_NAME: oStock.ITM_NAME,
              PACK_KEY: oStock.PACK_KEY,
              SERIAL_NO: oStock.SERIAL_NO,
              STOCK_NO: oStock.STOCK_NO,
              VAL_TYPE: oStock.VAL_TYPE,
              SHORT_COMING: false,
              QTY: oStock.QTY,
            })),
            direction: 'out',
            payload: {
              lpn: context.result.label,
              taskNo: sTaskId,
              taskType: 'Inbound',
              locationSource: sStockLabel,
              locationDestination: context.result.label,
              palletType: sSize === 'S' ? '800' : '1000',
              checkWidth: 'N',
              checkHeight: 'N',
            },
            created_by: user._id.toString(),
          };

          const aTasks = await context.app.service('agf-tasks').find({
            query: {
              order_id,
              direction: 'out',
              location_source: sStockLabel,
              location_destination: context.result.label,
              status: {
                $in: [1, 2],
              },
            },
          });

          if (aTasks.total) {
            context.result.agf_task = aTasks.data[0];
            return context;
          }

          const register = await context.app
            .service('agf-tasks')
            .create(oAgfRequest);

          if (register.status === 'error') {
            throw new errors.BadRequest(
              `Something went wrong when called the AGF. ${
                register.result.message || register.result
              }`
            );
          } else if (register.status === 'fail') {
            throw new errors.BadRequest(
              `AGF response with an error. Error (${register.result.errorCode}): ${register.result.errorMessage}`
            );
          } else {
            // Change the order status to in process
            await context.app.service('orders').patch(
              order._id,
              {
                status: 2,
              },
            );

            context.result.agf_task = register;
          }
        }

        return context;
      },
    ],
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
