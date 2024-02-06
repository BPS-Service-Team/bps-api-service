const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow, iff, isProvider } = require('feathers-hooks-common');
const validate = require('@feathers-plus/validate-joi');
const errors = require('@feathersjs/errors');

const joiOptions = require('../../utils/joi.options').options();
const Schema = require('../../schemas/pallet-ready.schema');
const { iterateKeyCond, iterateKeyExactly } = require('../../utils/conditional');

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [disallow()],
    get: [disallow()],
    create: [validate.form(Schema.POST_SCHEMA, joiOptions)],
    update: [disallow()],
    patch: [disallow()],
    remove: [disallow()],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      iff(
        isProvider('rest'),
        async context => {
          const { order_id, pallet_id, items, label: workstation_id, task_no } = context.data,
            { user } = context.params,
            aOrder = await context.app.service('orders').find({
              query: {
                order_id,
                $limit: 1
              }
            });

          if (!aOrder.total) {
            throw new errors.BadRequest(`The order, with the ID "${order_id}" doesn't exist`);
          }

          const order = aOrder.data[0];
          let aNotExist = [], aExceeds = [],
            aSumItems = [], aAlreadyClose = [],
            oConfig = {};

          if (order.cancelled) {
            throw new errors.BadRequest(
              'The order was already cancelled.',
              {
                cancelled: true,
              }
            );
          } else if (order.status !== 1 && order.status !== 2 && order.status !== 5) {
            throw new errors.BadRequest('The order is in a status other than open');
          } else if (order.status === 6) {
            throw new errors.BadRequest(
              'Order status is "standby", the order picking related to this putaway must be completed'
            );
          }

          // Check if all items it's present into the order
          for (let item of items) {
            let blnExist = false;

            for (let oSingle of order.agf) {
              if (
                order.agf.filter(agfItem => agfItem.STOCK_NO === oSingle.STOCK_NO).length > 1 ?
                  iterateKeyExactly(
                    item, oSingle,
                    ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
                  ) : iterateKeyCond(
                    item, oSingle,
                    ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
                  )
              ) {
                blnExist = true;

                if (item.QTY > oSingle.SUG_PA_QTY) {
                  aExceeds.push(item.STOCK_NO);
                }

                if (item.QTY + (oSingle.PA_QTY || 0) > oSingle.SUG_PA_QTY) {
                  aExceeds.push(item.STOCK_NO);
                }

                if (oSingle.SHORT_COMING) {
                  aAlreadyClose.push(item.STOCK_NO);
                }

                aSumItems.push(
                  JSON.parse(JSON.stringify(item))
                );
                break;
              }
            }

            if (!blnExist) {
              aNotExist.push(item.STOCK_NO);
            }
          }

          if (aNotExist.length) {
            throw new errors.BadRequest(`The next stock numbers doesn't exists into the order: "${aNotExist.join(', ')}"`);
          }

          if (aExceeds.length) {
            throw new errors.BadRequest(`The incoming quantity of the following stock numbers "${aExceeds.join(', ')}" is greater than that registered in the orders`);
          }

          if (aAlreadyClose.length) {
            throw new errors.BadRequest(`The following stock numbers "${aAlreadyClose.join(', ')}" of the order are already closed`);
          }

          if (!pallet_id) {
            throw new errors.BadRequest('The pallet id is required');
          }

          // Validate the size pallet
          let sSize = pallet_id[0];
          if (['L', 'S'].indexOf(sSize) === -1) {
            throw new errors.BadRequest(`The size "${sSize}" is not allowed`);
          }

          // Find is the pallet Id already exists into stocks
          let aExist = await context.app.service('stocks').find({
            query: {
              pallet_id,
              $select: ['_id', 'label'],
              $limit: 1,
            }
          });

          if (aExist.total === 0) {
            throw new errors.BadRequest(`There is no reserved stock with pallet ID "${pallet_id}"`);
          } else if (aExist.total > 1) {
            throw new errors.BadRequest(`There is more than one stock reserved with the pallet ID "${pallet_id}"`);
          }

          let sStockLabel = aExist.data[0].label;
          // Check the quantities
          const stocks = await context.app.service('stocks').Model.find({
            stocks: {
              $elemMatch: {
                ORDER_ID: order.order_id,
              }
            }
          });

          // Sum the quantities register in the stocks with the incoming
          aExceeds = [];
          for (let oRecord of stocks) {
            if (!oRecord.stocks) {
              continue;
            }
            for (let oSingle of oRecord.stocks) {
              let oExist = aSumItems.find(
                item => iterateKeyCond(
                  item, oSingle,
                  ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
                ));

              if (oExist) {
                oExist.QTY += oSingle.QTY;

                let oItem = items.find(
                  item => iterateKeyCond(
                    item, oSingle,
                    ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
                  ));

                if (oItem) {
                  if (oExist.QTY > oItem.SUG_PA_QTY) {
                    aExceeds.push(`There is already ${oSingle.QTY} quantity in the stocks, with the incoming quantity ${oItem} exceeding the quantity registered in the order.`);
                  }
                }
              }
            }
          }

          if (aExceeds.length) {
            throw new errors.BadRequest(aExceeds.join('\n'));
          }

          // Get the general config to parse the checks
          const config = await context.app.service('configs').find({
            query: {
              slug: {
                $in: ['general']
              }
            }
          });

          for (let oSingle of config.data) {
            for (let oItem of oSingle.elements) {
              oConfig[oItem.slug.replace(/-/g, '_')] = oItem.value;
            }
          }

          let oResult = {
            result: true,
          };

          // Find if the order id have tasks "Requested" or "Start"
          const aTasks = await context.app.service('agf-tasks').find({
            query: {
              order_id: order.order_id,
              status: {
                $in: [1, 2], // request, start
              },
              $limit: 0
            }
          });

          if (aTasks.total) {
            throw new errors.BadRequest(
              `There is already a task related to the order "${order.order_id}", which is requested or has already started`
            );
          }

          // Find tasks with 'cancel_on_finish' flag
          const aTasksWithCancel = await context.app.service('agf-tasks').find({
            query: {
              order_id: order.order_id,
              cancel_on_finish: true,
              $limit: 0,
            },
          });

          let sTaskId = task_no || `T${new Date().getTime()}`,
            oAgfRequest = {
              order_id: order.order_id,
              direction: 'in',
              task_no: sTaskId,
              type: 'create',
              request: items,
              check: order.type === 'picking' ? false : ((oConfig.check_width === 'Y' || oConfig.check_height === 'Y') ? true : false),
              payload: {
                lpn: sStockLabel,
                taskNo: sTaskId,
                taskType: 'Inbound',
                locationSource: workstation_id,
                locationDestination: sStockLabel,
                palletType: sSize === 'S' ? '800' : '1000',
                checkWidth: order.type === 'picking' ? 'N' : (oConfig.check_width || 'N'),
                checkHeight: order.type === 'picking' ? 'N' : (oConfig.check_height || 'N'),
              },
              created_by: user._id.toString(),
            };

          if (aTasksWithCancel.total) {
            oAgfRequest.cancel_on_finish = true;
          }

          await context.app.service('agf-tasks').create(oAgfRequest, context.params);
          oResult.agf_task_no = sTaskId;

          // Change the order status to in process
          if (order.status !== 5) {
            await context.app.service('orders').patch(order._id, {
              status: 2
            });
          }

          context.result = oResult;
        },
      )
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
