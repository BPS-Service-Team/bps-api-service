const joiOptions = require('../../../utils/joi.options').options();
const axios = require('axios');
const Schema = require('../../../schemas/putaways.schema');
const returnSchema = require('../../../schemas/stock-return.schemas');

const { createPicking } = require('../../../utils/pickings');
const { checkIsOrderComplete } = require('../../../utils/putaways');
const logger = require('../../../logger');

exports.PutawaysCancel = class PutawaysCancel {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    let oValidation, oResult;

    try {
      const { user } = params,
        { type } = this.options,
        app = this.app;

      delete data['created_by'];
      if (type === 'putaway') {
        oValidation = await Schema.CANCEL_SCHEMA.validate(data, joiOptions);
      } else if (type === 'return') {
        oValidation = await returnSchema.CANCEL_SCHEMA.validate(data, joiOptions);
      } else {
        return {
          errno: 1,
          result: 'fail',
          message: `Type '${type}' isn't supported`,
        };
      }

      if (oValidation.error) {
        return {
          errno: 1,
          message: oValidation.error.message,
          result: 'fail',
        };
      }

      params.provider = undefined;
      let sMK = type === 'putaway' ? 'GR' : 'SR',
        sSK = type === 'putaway' ? 'GR' : 'RT',
        sLK = type === 'putaway' ? 'PA' : 'SR';

      let aGrList = data[`${sMK}_LIST`][0],
        aItems = aGrList[`${sMK}_LIST_ITEM`],
        sPlCode = aGrList[`${sLK}_LIST_NO`],
        sGrCode = sPlCode.split('-')[0],
        blnError = false;

      // Check all order lines have the same GR CODE
      for (let oSingle of aItems) {
        if (oSingle[`${sSK}_CODE`] !== sGrCode) {
          blnError = true;
          break;
        }
      }

      if (blnError) {
        return {
          errno: 1,
          result: 'fail',
          message: `Found order lines with different ${sSK}_CODE's`,
        };
      }

      // Check if the order exist
      let oExist = await app.service('orders').find({
        ...params,
        query: {
          order_id: sGrCode,
          type,
        }
      });

      if (!oExist.total) {
        return {
          errno: 1,
          result: 'fail',
          message: sSK + '_CODE not exists',
        };
      }

      let oOrder = oExist.data[0];
      if (oOrder.cancelled) {
        return {
          errno: 1,
          result: 'fail',
          message: 'Not Allowed. Order already cancelled before',
        };
      }

      // Fn for a finished order
      if (oOrder.status === 3) {
        let sSuffix = oOrder.type === 'return' ? 'SRC' : 'GRC';
        let aPickingItems = [];
        if (oOrder.agf) {
          aPickingItems = aPickingItems.concat(oOrder.agf);
        }
        if (oOrder.agv) {
          aPickingItems = aPickingItems.concat(oOrder.agv);
        }

        if (aPickingItems.length) {
          let oPickingOrder = {
            BATCHID: `${new Date().getTime()}`,
            DO_LIST: [
              {
                DO_LIST_NO: `${sGrCode}${sSuffix}-1`,
                DO_LIST_ITEM: aPickingItems.map(oItem => {
                  const sCode = oItem[`${sSK}_CODE`];
                  return {
                    DO_DATE: oItem[`${sSK}_DATE`],
                    DO_CODE: `${sCode}${sSuffix}`,
                    DOD_SEQ: oOrder.type === 'return' ? oItem.RTD_SEQ : oItem.GRA_SEQ,
                    PLD_SEQ: oOrder.type === 'return' ? oItem.RTD_SEQ : oItem.GRD_SEQ,
                    STOCK_NO: oItem.STOCK_NO,
                    PACK_KEY: oItem.PACK_KEY,
                    ITM_NAME: oItem.ITM_NAME,
                    PLANT: oItem.PLANT,
                    STO_LOC: oItem.STO_LOC,
                    BATCH_NO: oItem.BATCH_NO,
                    SERIAL_NO: oItem.SERIAL_NO,
                    VAL_TYPE: oItem.VAL_TYPE,
                    STOCK_TYPE: oItem.STOCK_TYPE,
                    EXPIRY_DATE: oItem.EXPIRY_DATE,
                    MANU_DATE: oItem.MANU_DATE,
                    SUG_PICK_QTY: oItem.PA_QTY,
                    WES_LOC: oItem.WES_LOC,
                    PRIORITY: oItem.PRIORITY,
                  };
                }),
              },
            ],
          };
          const oPickingResponse = await createPicking(app, oPickingOrder, params);
          await app.service('wms-logs').create(
            {
              type: 'picking',
              from: {
                text: 'WES',
                domain: params.ip,
              },
              to: {
                text: 'WES',
                domain: params.ip,
              },
              order_id: `${sGrCode}${sSuffix}`,
              command: 'orders/picking',
              request: oPickingOrder,
              reply: oPickingResponse,
              status: 1,
            }
          );
        }

        return {
          errno: 1,
          AGVresult: oOrder.agv?.length ? 'fail' : 'success',
          AGFresult: oOrder.agf?.length ? 'fail' : 'success',
          message: 'Cancel fails. Order Finished',
        };
      }

      let aKeys = oOrder.type === 'return'
          ? ['rtd_seq', 'pack_key', 'batch_no', 'val_type', 'sug_pa_qty']
          : ['grd_seq', 'gra_seq', 'pack_key', 'batch_no', 'val_type', 'sug_pa_qty'],
        sAGVStatus = 'success', sAGFStatus = 'success',
        oNewData = {
          updated_by: user._id.toString(),
        },
        aOrderLines = [].concat(oOrder.agv || [])
          .concat(oOrder.agf || []);

      // Iterate the item list, and check if exist into the order saved in the database
      for (let oSingle of aItems) {
        for (let oItem of aOrderLines) {
          if (
            oSingle.STOCK_NO === oItem.STOCK_NO &&
            oSingle.BATCH_NO === oItem.BATCH_NO &&
            oSingle.VAL_TYPE === oItem.VAL_TYPE &&
            oSingle.WES_LOC === oItem.WES_LOC &&
            oSingle.RTD_SEQ === oItem.RTD_SEQ
          ) {
            for (let sKey of aKeys) {
              if (oSingle[sKey.toUpperCase()] !== oItem[sKey.toUpperCase()]) {
                return {
                  errno: 1,
                  result: 'fail',
                  message: `Order line not found (STOCK_NO: ${oSingle.STOCK_NO})`,
                };
              }
            }
          }
        }
      }

      let aAgfTasks = [], aAgvTasks = [];
      // Check if AGFs lines is present
      if (oOrder.agf_status === 0) {
        // Check if exist any task of this order
        aAgfTasks = await app.service('agf-tasks').find({
          query: {
            order_id: sGrCode,
          }
        });

        if (aAgfTasks.total) {
          for (let oSingle of aAgfTasks.data) {
            await app
              .service('agf-tasks')
              .patch(oSingle._id, { cancel_on_finish: true }, params);
          }
          // If exist, means it cannot be canceled
          sAGFStatus = 'fail';
        } else {
          oNewData.agf = oOrder.agf;
          oNewData.agf_pallets = [];

          for (let oSingle of oNewData.agf) {
            oSingle.CANCEL_FLAG = 'Y';
            oSingle.STATUS = 304;
            oSingle.PA_QTY = 0;
          }
        }
      }

      if (oOrder.agv_status === 0) {
        // Check if exist any task of this order
        aAgvTasks = await app.service('agv-tasks').find({
          query: {
            order_id: sGrCode,
          }
        });

        if (aAgvTasks.total) {
          // Get the general config to parse the checks
          const config = await app.service('configs').find({
            query: {
              slug: {
                $in: ['agv-api']
              }
            }
          });

          let oConfig = {};
          for (let oSingle of config.data) {
            for (let oItem of oSingle.elements) {
              if (oItem.type === 'json') {
                oConfig[oItem.slug.replace(/-/g, '_')] = JSON.parse(oItem.value);
              } else {
                oConfig[oItem.slug.replace(/-/g, '_')] = oItem.value;
              }
            }
          }

          let oAGVData = {
              header: oConfig.headers,
              body: {
                receipt_amount: 0,
                receipt_list: []
              }
            },
            iCount = 0,
            aReceiptList = [];

          for (let oSingle of aAgvTasks.data) {
            if (oSingle.status === 1) {
              iCount++;
              aReceiptList.push({
                owner_code: oConfig.headers.user_id,
                receipt_code: oSingle.receipt_code,
                cancel_date: new Date().getTime(),
                remark: 'Cancel by the WES system',
              });
              await app
                .service('agv-tasks')
                .patch(oSingle._id, { cancel_on_finish: true }, params);
            }
          }

          oAGVData.body.receipt_amount = iCount;
          oAGVData.body.receipt_list = aReceiptList;
          const response = await axios({
            method: 'POST',
            url: `${oConfig.url}/geekplus/api/artemis/pushJson/receiptNoteCancel?${oConfig.query}`,
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
            },
            data: oAGVData,
          });

          let oLog = {
            type,
            from: {
              text: 'WES',
              domain: params.ip,
            },
            to: {
              text: 'AGV',
              domain: oConfig.url,
            },
            order_id: sGrCode,
            command: 'agvs/cancel',
            request: oAGVData,
            reply: {},
            created_by: params.user._id.toString(),
            status: 0,
          };

          if (response.status === 201 || response.status === 200) {
            const { header } = response.data;

            if (header.msgCode === '200') {
              oNewData.agv = oOrder.agv;

              for (let oSingle of oNewData.agv) {
                oSingle.CANCEL_FLAG = 'Y';
                oSingle.STATUS = 304;
                oSingle.PA_QTY = 0;
              }
            } else {
              sAGVStatus = 'fail';
            }
          } else {
            let sSuffix = oOrder.type === 'return' ? 'SRC' : 'GRC';

            // here create order picking for this order
            let oPickingOrder = {
              BATCHID: `${new Date().getTime()}`,
              DO_LIST: [
                {
                  DO_LIST_NO: `${sGrCode}${sSuffix}-1`,
                  DO_LIST_ITEM: oOrder.agv.map(oItem => {
                    const sCode = oItem[`${sSK}_CODE`];
                    return {
                      DO_DATE: oItem[`${sSK}_DATE`],
                      DO_CODE: `${sCode}${sSuffix}`,
                      DOD_SEQ: oOrder.type === 'return' ? oItem.RTD_SEQ : oItem.GRA_SEQ,
                      PLD_SEQ: oOrder.type === 'return' ? oItem.RTD_SEQ : oItem.GRD_SEQ,
                      STOCK_NO: oItem.STOCK_NO,
                      PACK_KEY: oItem.PACK_KEY,
                      ITM_NAME: oItem.ITM_NAME,
                      PLANT: oItem.PLANT,
                      STO_LOC: oItem.STO_LOC,
                      BATCH_NO: oItem.BATCH_NO,
                      SERIAL_NO: oItem.SERIAL_NO,
                      VAL_TYPE: oItem.VAL_TYPE,
                      STOCK_TYPE: oItem.STOCK_TYPE,
                      EXPIRY_DATE: oItem.EXPIRY_DATE,
                      MANU_DATE: oItem.MANU_DATE,
                      SUG_PICK_QTY: oItem.PA_QTY,
                      WES_LOC: oItem.WES_LOC,
                      PRIORITY: oItem.PRIORITY,
                    };
                  }),
                },
              ],
            };
            const oPickingResponse = await createPicking(app, oPickingOrder, params);
            await app.service('wms-logs').create(
              {
                type: 'picking',
                from: {
                  text: 'WES',
                  domain: params.ip,
                },
                to: {
                  text: 'WES',
                  domain: params.ip,
                },
                order_id: `${sGrCode}${sSuffix}`,
                command: 'orders/picking',
                request: oPickingOrder,
                reply: oPickingResponse,
                status: 1,
              }
            );
            sAGVStatus = 'fail';
          }

          oLog.status = sAGVStatus === 'success' ? 1 : 0;
          oLog.reply = response.data;
          await app.service('wms-logs').create(oLog);
        }
      }

      if (oOrder.agv_status === 1) {
        sAGVStatus = 'fail';
      }

      if (sAGFStatus === 'fail' && sAGVStatus === 'fail') {
        // Update the order lines of the corresponding items
        await app.service('orders').patch(oOrder._id, oNewData, params);

        return {
          errno: 1,
          AGVresult: 'fail',
          AGFresult: 'fail',
          message: 'AGV and AGF cancel failed',
        };
      }

      if (sAGFStatus === 'success' || sAGVStatus === 'success') {
        // Release the stocks and pallets
        params.provider = 'rest';
        if (sAGFStatus === 'success' && oOrder.agf_pallets) {
          if (oOrder.agf_pallets.length) {
            await app.service('scan-pallet').create({
              order_id: sGrCode,
              pallet_id: oOrder.agf_pallets.join(','),
              operation: 'release',
            }, params);
          }
        }

        if (sAGVStatus === 'success' && aAgvTasks.total) {
          // Update the agv task status
          for (let oSingle of aAgvTasks.data) {
            await app.service('agv-tasks').patch(oSingle._id, { status: 3 }, params);
          }
        }

        if (sAGFStatus === 'success' && aAgfTasks.total) {
          // Update the agf task status
          for (let oSingle of aAgfTasks) {
            await app.service('agf-tasks').patch(oSingle._id, { status: 5 }, params);
          }
        }

        params.provider = 'rest';
        if (sAGFStatus === 'fail') {
          return {
            errno: 1,
            AGVresult: 'success',
            AGFresult: 'fail',
            message: 'AGV Cancel Success but AGF cancel failed. Task already executed',
          };
        } else if (sAGVStatus === 'fail') {
          return {
            errno: 1,
            AGVresult: 'fail',
            AGFresult: 'success',
            message: 'AGF Cancel Success but AGV cancel failed. Task already executed',
          };
        } else {
          oResult = {
            errno: 0,
            AGVresult: 'success',
            AGFresult: 'success',
            message: 'Cancel Success'
          };
          oNewData.cancelled = true;
        }

        params.provider = undefined;
        oNewData.status = 5;
        // Update the order lines of the corresponding items
        await app.service('orders').patch(oOrder._id, oNewData, params);

        if (sAGFStatus === 'success' || sAGVStatus === 'success') {
          checkIsOrderComplete(oOrder.order_id, app, params);
        }
        params.provider = 'rest';
      }
    } catch (err) {
      logger.error('[PutawaysCancel/create] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
      oResult = {
        errno: 1,
        message: err.message,
        result: 'fail',
        errors: err.errors || undefined,
      };
    }

    return oResult;
  }
};
