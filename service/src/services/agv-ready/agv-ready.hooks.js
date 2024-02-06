const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow, iff, isProvider } = require('feathers-hooks-common');
const validate = require('@feathers-plus/validate-joi');
const errors = require('@feathersjs/errors');
const moment = require('moment');

const joiOptions = require('../../utils/joi.options').options();
const Schema = require('../../schemas/agv-ready.schema');
const operations = require('../../utils/putaways');

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
          const { order_id, items } = context.data,
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
            oConfig = {},
            oResult = {
              result: true,
            },
            sQtyKey = ['putaway', 'return'].indexOf(order.type) > -1 ? 'SUG_PA_QTY' : 'SUG_PICK_QTY';

          if (order.cancelled) {
            throw new errors.BadRequest('The order is with the status of canceled.');
          } else if (order.status !== 1 && order.status !== 2) {
            throw new errors.BadRequest('The order is in a status other than open');
          }

          // Check if all items it's present into the order
          for (let item of items) {
            let blnExist = false;

            for (let oSingle of order.agv) {
              if (
                item.STOCK_NO === oSingle.STOCK_NO &&
                item.ITM_NAME === oSingle.ITM_NAME &&
                item.PACK_KEY === oSingle.PACK_KEY &&
                item.BATCH_NO === oSingle.BATCH_NO &&
                item.SERIAL_NO === oSingle.SERIAL_NO &&
                item.VAL_TYPE === oSingle.VAL_TYPE
              ) {
                blnExist = true;

                if (item.QTY > oSingle[sQtyKey]) {
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

          // Get the general config to parse the checks
          const config = await context.app.service('configs').find({
            query: {
              slug: {
                $in: ['agv-api']
              }
            }
          });

          for (let oSingle of config.data) {
            for (let oItem of oSingle.elements) {
              if (oItem.type === 'json') {
                oConfig[oItem.slug.replace(/-/g, '_')] = JSON.parse(oItem.value);
              } else {
                oConfig[oItem.slug.replace(/-/g, '_')] = oItem.value;
              }
            }
          }

          // Find if the order id have tasks "Requested" or "Start"
          const aTasks = await context.app.service('agv-tasks').find({
            query: {
              order_id: order.order_id,
              status: 1,
              $limit: 0
            }
          });

          if (aTasks.total) {
            throw new errors.BadRequest(
              `There is already a task related to the order "${order.order_id}", which is requested or has already started`
            );
          }

          let sCode = `${order.order_id}${
              ['putaway', 'picking', 'return'].indexOf(order.type) > -1 ? '-1' : ''
            }`,
            aSkuList = [],
            aRequestItems = [];

          for (let oSingle of order.agv) {
            let sSequence;
            if (oSingle.GRD_SEQ) {
              sSequence = `${oSingle.GRD_SEQ},${oSingle.GRA_SEQ}`;
            } else if (oSingle.DOD_SEQ) {
              sSequence = `${oSingle.DOD_SEQ},${oSingle.PLD_SEQ}`;
            } else if (oSingle.RTD_SEQ) {
              sSequence = `${oSingle.RTD_SEQ}`;
            }

            let oNew = order.type === 'picking' ? {
              amount: oSingle[sQtyKey],
              expiration_date: oSingle.EXPIRY_DATE ? moment(oSingle.EXPIRY_DATE, 'YYYY/MM/DD').toDate().getTime() : null,
              out_batch_code: oSingle.BATCH_NO,
              owner_code: oConfig.headers.user_id,
              pack_key: oSingle.PACK_KEY || null,
              production_date: oSingle.MANU_DATE ? moment(oSingle.MANU_DATE, 'YYYY/MM/DD').toDate().getTime() : null,
              sku_code: oSingle.STOCK_NO,
              sku_level: 0,
              valuation_type: oSingle.VAL_TYPE || null,
            } : {
              amount: oSingle[sQtyKey],
              expiration_date: oSingle.EXPIRY_DATE ? moment(oSingle.EXPIRY_DATE, 'YYYY/MM/DD').toDate().getTime() : null,
              out_batch_code: oSingle.BATCH_NO,
              owner_code: oConfig.headers.user_id,
              pack_key: oSingle.PACK_KEY || null,
              production_date: oSingle.MANU_DATE ? moment(oSingle.MANU_DATE, 'YYYY/MM/DD').toDate().getTime() : null,
              sku_code: oSingle.STOCK_NO,
              sku_level: 0,
              sku_name: oSingle.ITM_NAME,
              valuation_type: oSingle.VAL_TYPE || null,
            };

            if (sSequence) {
              oNew.sku_reservation_1 = sSequence;
            }
            aSkuList.push(oNew);

            aRequestItems.push({
              BATCH_NO: oSingle.BATCH_NO,
              ITM_NAME: oSingle.ITM_NAME,
              OWNER_CODE: oConfig.headers.user_id,
              PACK_KEY: oSingle.PACK_KEY,
              QTY: oSingle[sQtyKey],
              SERIAL_NO: oSingle.SERIAL_NO,
              SKU_LEVEL: 0,
              STOCK_NO: oSingle.STOCK_NO,
              VAL_TYPE: oSingle.VAL_TYPE,
            });
          }

          let oAGVData = {
              header: oConfig.headers,
              body: order.type === 'picking' ? {
                order_amount: aSkuList.length,
                order_list: [{
                  warehouse_code: oConfig.headers.warehouse_code,
                  out_order_code: sCode,
                  owner_code: oConfig.headers.user_id,
                  order_type: 0,
                  creation_date: new Date().getTime(),
                  sku_list: aSkuList,
                }]
              } : {
                receipt_amount: aSkuList.length,
                receipt_list: [{
                  receipt_code: sCode,
                  type: 0,
                  creation_date: new Date().getTime(),
                  sku_list: aSkuList
                }]
              }
            },
            oAgvRequest = {
              receipt_code: sCode,
              order_id: order.order_id,
              order_type: order.type,
              request: aRequestItems,
              direction: order.type === 'picking' ? 'out' : 'in',
              type: 'create',
              payload: oAGVData,
              created_by: user._id.toString(),
            };

          const register = await context.app.service('agv-tasks').create(oAgvRequest, context.params);
          if (register) {
            oResult.agv_receipt_code = sCode;
            operations.checkPendingTasks(context.app, context.params);
          }

          // Change the order status to in process
          await context.app.service('orders').patch(order._id, {
            status: 2
          });

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
