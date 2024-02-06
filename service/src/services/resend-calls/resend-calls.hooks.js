const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');
const errors = require('@feathersjs/errors');
const axios = require('axios');
const validate = require('@feathers-plus/validate-joi');
const moment = require('moment');

const joiOptions = require('../../utils/joi.options').options();
const Schema = require('../../schemas/resend-calls.schema');
const logger = require('../../logger');

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [disallow()],
    get: [disallow()],
    create: [validate.form(Schema.POST_SCHEMA, joiOptions)],
    update: [disallow()],
    patch: [disallow()],
    remove: [disallow()]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      async context => {
        const { command, order_id, task_id } = context.result;
        const { user } = context.params;

        const aOrders = await context.app.service('orders').find({
          query: {
            order_id,
            $limit: 1,
          },
        });
        const order = aOrders.data[0];

        if (!order) {
          throw new errors.BadRequest('Order not found');
        }

        if (command === 'wms/send') {
          const aLogs = await context.app.service('wms-logs').find({
            query: {
              command,
              order_id,
              $select: ['from', 'to', 'order_id', 'type', 'command', 'reply', 'request', 'status'],
              $limit: 1,
            },
          });

          let wmsLog = aLogs.data[0];
          wmsLog.created_by = context.result.created_by;
          delete wmsLog._id;

          if (!wmsLog) {
            throw new errors.BadRequest('Inexisting previous log', {
              error: 'error',
            });
          }

          const aEndpoints = await context.app.service('configs').find({
            query: {
              slug: 'wms-api'
            }
          });
          let oEndpoint = aEndpoints.data[0],
            oConfig = {};

          for (let oItem of oEndpoint.elements) {
            oConfig[oItem.slug.replace(/-/g, '_')] = oItem.value;
          }

          let sAction = oConfig[`${wmsLog.type}_action`];

          if (sAction) {
            return axios({
              method: 'POST',
              url: oConfig.url,
              headers: {
                'Authorization': oConfig.authorization,
                'Content-type': 'text/xml;charset="utf-8"',
                'SOAPAction': sAction,
              },
              data: wmsLog.request,
            })
              .then(async response => {
                if (response.status === 200) {
                  wmsLog.status = 1;
                  wmsLog.reply = response.data;

                  await context.app.service('orders').patch(order._id, {
                    pending_feedback: false,
                    status: order.status !== 5 ? 3 : 5,
                  });
                } else {
                  wmsLog.status = 0;
                  wmsLog.reply = response.data;

                  await context.app.service('orders').patch(order._id, { pending_feedback: true });
                }

                await context.app.service('wms-logs').create(wmsLog);
              })
              .catch(async error => {
                logger.error('[resend-calls] Error: %s', error.message || (typeof error === 'string' ? error : JSON.stringify(error)));
                wmsLog.status = 0;
                if (error?.response?.data) {
                  wmsLog.reply = error.response.data;
                } else if (error?.message) {
                  wmsLog.reply = error.message;
                } else {
                  wmsLog.reply = error;
                }

                await context.app.service('wms-logs').create(wmsLog);
                await context.app.service('orders').patch(order._id, { pending_feedback: true });
              });
          }
        }

        if (command === 'agvs/create') {
          const oTask = await context.app.service('agv-tasks').get(task_id);
          if (oTask) {
            const aOrders2 = await context.app.service('orders').find({
              query: {
                order_id: oTask.order_id,
                $limit: 1,
              },
            });
            const oOrder = aOrders2.data[0];
            let oConfig = {};

            const aConfig = await context.app.service('configs').find({
              query: {
                slug: {
                  $in: ['agv-api'],
                },
              },
            });

            for (let oSingle of aConfig.data) {
              for (let oItem of oSingle.elements) {
                if (oItem.type === 'json') {
                  oConfig[oItem.slug.replace(/-/g, '_')] = JSON.parse(oItem.value);
                } else {
                  oConfig[oItem.slug.replace(/-/g, '_')] = oItem.value;
                }
              }
            }

            let sCode = `WES${moment().format('YYYYMMDD')}.${oOrder.order_id}${
                (oOrder.type === 'putaway' || oOrder.type === 'picking') ? '-1' : ''
              }`,
              aSkuList = [],
              aRequestItems = [],
              sQtyKey = ['putaway', 'return'].indexOf(order.type) > -1 ? 'SUG_PA_QTY' : 'SUG_PICK_QTY';

            for (const oSingle of oOrder.agv) {
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
                  }],
                } : {
                  receipt_amount: aSkuList.length,
                  receipt_list: [{
                    receipt_code: sCode,
                    type: 0,
                    creation_date: new Date().getTime(),
                    sku_list: aSkuList,
                  }],
                },
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
              context.result.status = register.status;
            }

            return context;
          }
        }
      },
    ],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
