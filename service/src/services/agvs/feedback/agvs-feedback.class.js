const operations = require('../../../utils/putaways');
const { iterateKeyExactly, iterateKeyCond } = require('../../../utils/conditional');
const Schema = require('../../../schemas/agvs.schema');
const { getCustomOptions } = require('../../agfs/custom.functions');
const logger = require('../../../logger');

const IS_DEBUG = process.env.CONFIG_DEBUG_MOCK || false;

const fnFakeResponse = async (data, sListKey, sReceiptKey) => {
  let oResult,
    aCodes = [
      '200140-3.1.1', '200140-3.1.2', '200140-3.1.3', '200141-3.2.1',
      '200141-3.2.2', '200141-3.2.3', '200142-1', '200143-1',
    ],
    list = data[sListKey];

  if (list) {
    for (let oItem of list) {
      if (aCodes.indexOf(oItem[sReceiptKey]) > -1) {
        oResult = {
          header: {
            msgCode: '200',
            message: 'Call successfully!',
          },
          body: {
            success: true,
          },
        };
        break;
      }
    }
  }

  return oResult;
};

exports.AgvsFeedback = class AgvsFeedback {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    const app = this.app,
      { type } = this.options;

    let oResult = {};
    try {
      delete data.created_by;
      let response, sListKey = '', sReceiptKey = '';

      if (type === 'feedback') {
        sListKey = 'receipt_list';
        sReceiptKey = 'receipt_code';
        response = await Schema.GR_FEEDBACK_SCHEMA.validate(data, getCustomOptions());
      } else if (type === 'pick-feedback') {
        sListKey = 'order_list';
        sReceiptKey = 'out_order_code';
        response = await Schema.GD_FEEDBACK_SCHEMA.validate(data, getCustomOptions());
      }

      if (response.error) {
        throw response.error.message;
      }

      if (IS_DEBUG) {
        const oFakeResponse = await fnFakeResponse(data, sListKey, sReceiptKey);
        if (oFakeResponse) {
          return oFakeResponse;
        }
      }

      const list = data.body[sListKey];
      let aErrors = [],
        aOrders = [];

      for (let oItem of list) {
        const aAgvTask = await app.service('agv-tasks').find({
            query: {
              receipt_code: oItem[sReceiptKey],
            },
          }),
          oTask = aAgvTask.data[0];

        if (oTask) {
          let aOrder = await app.service('orders').find({
              query: {
                order_id: oTask.order_id,
                $select: ['_id', 'agv', 'details', 'status', 'type', 'relocation', 'agf_status'],
                $limit: 1,
              },
            }),
            order = aOrder.data[0];

          if (order) {
            if (order.status === 1 || order.status === 2 || order.status === 5) {
              aOrders.push(oTask.order_id);
              await app.service('agv-tasks').patch(oTask._id, {
                status: 2, // finish
              });

              let aReceivedItems = [];
              // Check sku_list
              for (let oSku of oItem.sku_list) {
                aReceivedItems.push({
                  PACK_KEY: oSku.pack_key === '' ? null : oSku.pack_key,
                  STOCK_NO: oSku.sku_code,
                  BATCH_NO: oSku.out_batch_code === '' ? null : oSku.out_batch_code,
                  VAL_TYPE: oSku.valuation_type === '' ? null : oSku.valuation_type,
                  QTY: order.type === 'picking' ? oSku.pickup_amount : oSku.amount,
                  SKU_RESERVATION: oSku.sku_reservation_1,
                });
              }

              if (order?.agv.length) {
                let aAGVs = order.agv;

                for (let oAGV of aAGVs) {
                  let oExist = aReceivedItems.find(
                    item => iterateKeyExactly(
                      item, oAGV,
                      ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
                    ));

                  if (!oExist) {
                    oExist = aReceivedItems.find(
                      item => iterateKeyCond(
                        item, oAGV,
                        ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
                      )
                    );
                  }

                  if (oExist) {
                    oAGV.RECEIVED = true;
                    if (order.type === 'picking') {
                      oAGV.PICK_QTY = oExist.QTY || 0;
                    } else {
                      oAGV.PA_QTY = oExist.QTY || 0;
                    }
                  }
                }

                if (order.type === 'picking' && order.relocation) {
                  const aRelatedPutaway = await app.service('orders').find({
                    query: {
                      order_id: `${order.relocation}A`,
                    },
                  });

                  const oRelatedPutaway = aRelatedPutaway.data[0];
                  if (oRelatedPutaway) {
                    let aAgfLines = oRelatedPutaway.agf,
                      aAgvLines = oRelatedPutaway.agv;

                    for (const oAgfLine of aAgfLines) {
                      let aFinded = aReceivedItems.filter(
                        item => item.SKU_RESERVATION === `${oAgfLine.GRD_SEQ},${oAgfLine.GRD_SEQ}`
                      );

                      if (aFinded.length) {
                        let nAmount = 0;
                        for (const oFind of aFinded) {
                          nAmount += oFind.QTY;
                        }
                        oAgfLine.SUG_PA_QTY = nAmount;
                      }
                    }

                    for (const oAgvLine of aAgvLines) {
                      let aFinded = aReceivedItems.filter(
                        item => item.SKU_RESERVATION === `${oAgvLine.GRD_SEQ},${oAgvLine.GRD_SEQ}`
                      );

                      if (aFinded.length) {
                        let nAmount = 0;
                        for (const oFind of aFinded) {
                          nAmount += oFind.QTY;
                        }
                        oAgvLine.SUG_PA_QTY = nAmount;
                      }
                    }

                    await app.service('orders').patch(oRelatedPutaway._id, {
                      status: 1,
                      agf: aAgfLines,
                      agv: aAgvLines,
                    });

                    if (order.agf_status !== 0 && aAgvLines.length) {
                      await operations.readyAgv(app, params, oRelatedPutaway);
                    }
                  }
                }

                await app.service('orders').patch(
                  order._id,
                  { agv: aAGVs },
                  {
                    ...params,
                    provider: undefined,
                  },
                );
              }

              if (order.type === 'relocation') {
                let aDetails = order.details.map(oDetail => {
                  const { payload } = oDetail;
                  let oExist = aReceivedItems.find(
                    item => (item.STOCK_NO === payload.STOCK_NO &&
                      item.PACK_KEY === payload.PACK_KEY &&
                      item.VAL_TYPE === payload.TO_VAL_TYPE)
                  );

                  if (oExist) {
                    oDetail.status = 1;
                  }

                  delete oDetail._id;
                  return oDetail;
                });

                await app.service('orders').patch(
                  order._id,
                  { details: aDetails },
                  {
                    ...params,
                    provider: undefined,
                  },
                );
              }
            }
          } else {
            aErrors.push(`Order "${oTask.order_id}" is not in open status`);
          }
        } else {
          aErrors.push(`Receipt Code ${oItem[sReceiptKey]} not found.`);
        }
      }

      if (aErrors.length) {
        throw `Messages: ${aErrors.join(', ')}`;
      }

      for (let sOrderId of aOrders) {
        await operations.checkIsOrderComplete(sOrderId, app, params, data);
      }

      operations.checkPendingTasks(app, params);
      oResult = {
        body: {
          success: true,
        },
        header: {
          message: 'Call successfully!.',
          msgCode: '200',
        },
      };
    } catch (err) {
      logger.error('[AgvsFeedback/create] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
      oResult = {
        body: {
          success: false,
        },
        header: {
          message: err.message || err,
          msgCode: '500',
        },
      };
    }

    params.provider = 'rest';
    return oResult;
  }
};
