const { iff, isProvider } = require('feathers-hooks-common');
const logger = require('../logger');

const getTaskBy = async (context, query = {}, sModel = '') => {
  const mongooseClient = context.app.get('mongooseClient'),
    model = mongooseClient.models[sModel];

  if (model) {
    const task = await model.findOne(query).lean();

    return task;
  }

  return null;
};

const getOrderBy = async (context, order_id) => {
  const mongooseClient = context.app.get('mongooseClient'),
    model = mongooseClient.models.orders;

  if (model) {
    const order = await model.findOne({ order_id }).lean();

    return order;
  }

  return null;
};

module.exports = iff(
  isProvider('rest'),
  async context => {
    const { params, path, method } = context,
      { user } = params;

    if (path) {
      if (method === 'create') {
        let aServices = [
            'agfs/finish', 'agfs/start', 'agfs/check', 'agfs/cancel',
            'orders/cancel/putaway', 'orders/putaway', 'agvs/feedback',
            'orders/picking', 'orders/cancel/picking', 'orders/relocation',
            'orders/return', 'orders/cancel/return', 'agvs/picking/feedback',
            'agvs/reconciliation', 'agfs/status', 'orders/cancel/relocation',
            'agfs/wes/cancel',
          ],
          blnSave = false;

        if (aServices.indexOf(path) > -1) {
          try {
            const { data, result } = context,
              mongooseClient = context.app.get('mongooseClient'),
              model = mongooseClient.models.wmsLogs;

            let oLog = {
              from: {},
              to: {},
              type: undefined,
              order_id: '',
              command: path,
              request: data,
              reply: result,
              status: 1,
              created_by: user._id,
              created_at: new Date(),
            };
            let sKey, sList;

            if (
              [
                'agfs/finish', 'agfs/start', 'agfs/check', 'agfs/cancel', 'agfs/status', 'agfs/wes/cancel'
              ].indexOf(path) > -1
            ) {
              blnSave = true;
              oLog.request = data.payload || data;
              const task = await getTaskBy(context, { task_no: data.task_no }, 'agf_tasks'),
                order = task ? await getOrderBy(context, task.order_id) : null;

              oLog.order_id = task ? task.order_id : undefined;
              oLog.status = !result.errno ? 1 : 0;
              oLog.type = order ? order.type : undefined;
              oLog.from = {
                text: ['agfs/wes/cancel'].indexOf(path) > -1 ? 'WES' : 'AGF',
                domain: params.ip,
              };
              oLog.to = {
                text: 'WES',
                domain: params.headers.host,
              };
            } else if (
              ['agvs/feedback', 'agvs/picking/feedback', 'agvs/reconciliation'].indexOf(path) > -1
            ) {
              const list = path.indexOf('picking') > -1 ? data.body.order_list : data.body.receipt_list,
                sKeyOrder = path.indexOf('picking') > -1 ? 'out_order_code' : 'receipt_code',
                { body } = result;

              oLog.request = data;
              oLog.from = {
                text: 'AGV',
                domain: params.ip,
              };
              oLog.to = {
                text: 'WES',
                domain: params.headers.host,
              };
              oLog.status = !body.success ? 0 : 1;

              if (!list) {
                oLog.order_id = '-9999999999';
                oLog.type = 'reconciliation';
                await model.create(oLog);
              } else {
                for (let oItem of list) {
                  let sOrder = oItem[sKeyOrder],
                    task = await getTaskBy(context, { receipt_code: sOrder, }, 'agv_tasks'),
                    order = task ? await getOrderBy(context, task.order_id) : null;

                  oLog.order_id = order ? order.order_id : sOrder.substring(0, sOrder.indexOf('-'));
                  oLog.type = order ? order.type : undefined;
                  await model.create(oLog);
                }
              }
            } else if (
              ['orders/picking', 'orders/cancel/picking'].indexOf(path) > -1
            ) {
              sKey = 'DO';
              sList = 'DO';
            } else if (
              ['orders/cancel/putaway', 'orders/putaway'].indexOf(path) > -1
            ) {
              sKey = 'GR';
              sList = 'PA';
            } else if (
              ['orders/cancel/return', 'orders/return'].indexOf(path) > -1
            ) {
              sKey = 'SR';
              sList = 'SR';
            } else if (
              ['orders/relocation', 'orders/cancel/relocation'].indexOf(path) > -1
            ) {
              sKey = 'SRE';
              sList = 'SRE';
            }

            if (sKey && sList) {
              blnSave = true;
              oLog.request = data;
              let oList = oLog.request[`${sKey}_LIST`][0],
                sGrCode = oList[`${sList}_LIST_NO`],
                sOrderId = sGrCode ? sGrCode.split('-')[0] : null;

              const order = sOrderId ? await getOrderBy(context, sOrderId) : null;
              oLog.order_id = sOrderId ? sOrderId : undefined;
              oLog.status = !result.errno ? 1 : 0;
              oLog.type = order ? order.type : undefined;
              oLog.from = {
                text: 'WMS',
                domain: params.ip,
              };
              oLog.to = {
                text: 'WES',
                domain: params.headers.host,
              };
            }

            if (blnSave && model) {
              await model.create(oLog);
            }
          } catch (err) {
            logger.error('[custom-logs] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
          }
        }
      }
    }

    return context;
  }
);
