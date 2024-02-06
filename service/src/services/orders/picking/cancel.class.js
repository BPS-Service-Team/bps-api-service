const joiOptions = require('../../../utils/joi.options').options();
const axios = require('axios');
const Schema = require('../../../schemas/pickings.schema');
const logger = require('../../../logger');

const { checkIsOrderComplete } = require('../../../utils/putaways');

const fnFakeResponse = async (sDoCode, aItems) => {
  const aDoCodes = ['000120', '000121', '000122', '000123', '000124'];
  let oResult;

  if (aDoCodes.includes(sDoCode)) {
    const blnIncludesFE = aItems.find(
      (oElement) => oElement.STOCK_NO === '19132647',
    );
    const blnIncludesSE = aItems.find(
      (oElement) => oElement.STOCK_NO === '19132641',
    );

    if (blnIncludesFE && blnIncludesSE) {
      const oResponses = {
        '000120': {
          errno: 1,
          AGVresult: 'fail',
          AGFresult: 'fail',
          message: 'AGV and AGF cancel failed. Task already executed',
        },
        '000121': {
          errno: 1,
          AGVresult: 'fail',
          AGFresult: 'Success',
          message:
            'AGF Cancel Success but AGV cancel failed. Task already executed',
        },
        '000122': {
          errno: 1,
          AGVresult: 'fail',
          AGFresult: 'fail',
          message: 'AGV and AGF cancel failed. Task already executed',
        },
        '000123': {
          errno: 1,
          AGVresult: 'Success',
          AGFresult: 'fail',
          message:
            'AGV Cancel Success but AGF cancel failed. Task already executed. Task already executed',
        },
        '000124': {
          errno: 1,
          AGVresult: 'fail',
          AGFresult: 'fail',
          message: 'AGV and AGF cancel failed. Task already executed',
        },
      };

      oResult = oResponses[sDoCode];
    }
  }

  return oResult;
};

exports.PickingsCancel = class PickingsCancel {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    let oValidation, oResult;

    try {
      const { user } = params,
        app = this.app;

      delete data['created_by'];
      oValidation = await Schema.CANCEL_SCHEMA.validate(data, joiOptions);

      if (oValidation.error) {
        throw oValidation.error.message;
      }

      params.provider = undefined;
      let aDoList = data.DO_LIST[0],
        aItems = aDoList.DO_LIST_ITEM,
        sPlCode = aDoList.DO_LIST_NO,
        sDoCode = sPlCode.split('-')[0],
        blnError = false;

      // Temporal validation for fake answers
      const oFakeResponse = await fnFakeResponse(sDoCode, aItems);

      if (oFakeResponse) {
        return oFakeResponse;
      }

      // Check all order lines have the same DO CODE
      for (let oSingle of aItems) {
        if (oSingle.DO_CODE !== sDoCode) {
          blnError = true;
          break;
        }
      }

      if (blnError) {
        throw "Found order lines with different DO_CODE's";
      }

      // Check if order exists
      let oExist = await app.service('orders').find({
        ...params,
        query: {
          order_id: sDoCode,
          type: 'picking',
        },
      });

      if (!oExist.total) {
        throw 'DO_CODE not exist';
      }

      let oOrder = oExist.data[0];
      if (oOrder.cancelled) {
        throw 'Not Allowed. Order already cancelled before';
      }

      if (oOrder.status === 3) {
        params.provider = 'rest';
        return {
          errno: 1,
          AGVresult: oOrder.agv?.length ? 'fail' : 'success',
          AGFresult: oOrder.agf?.length ? 'fail' : 'success',
          message: 'Cancel fails. Order Finished',
        };
      }

      let aKeys = [
          'dod_seq',
          'pld_seq',
          'stock_no',
          'pack_key',
          'itm_name',
          'uom',
          'plant',
          'sto_loc',
          'batch_no',
          'val_type',
          'stock_type',
          'sug_pick_qty',
        ],
        sAGVStatus = 'success',
        sAGFStatus = 'success',
        oNewData = {
          updated_by: user._id.toString(),
        },
        aOrderLines = [].concat(oOrder.agv || []).concat(oOrder.agf || []);

      // Iterate the item list, and check if exist into the order saved in the database
      for (let oSingle of aItems) {
        for (let oItem of aOrderLines) {
          for (let sKey of aKeys) {
            if (oSingle[sKey] !== oItem[sKey]) {
              throw `Order line not found (STOCK_NO: ${oSingle.STOCK_NO})`;
            }
          }
        }
      }

      let aAgfTasks = [],
        aAgvTasks = [];
      if (oOrder.agf_status === 0) {
        // Check if exist any task of this order
        aAgfTasks = await app.service('agf-tasks').find({
          query: {
            order_id: sDoCode,
          },
        });

        if (aAgfTasks.total) {
          for (let oSingle of aAgfTasks.data) {
            await app
              .service('agf-tasks')
              .patch(oSingle._id, { cancel_on_finish: true }, params);
          }
          // If exist, means it cannot be cancelled
          sAGFStatus = 'fail';
        } else {
          oNewData.agf = oOrder.agf;
          oNewData.agf_pallets = [];

          for (let oSingle of oNewData.agf) {
            oSingle.CANCEL_FLAG = 'Y';
            oSingle.STATUS = 304;
            oSingle.PICK_QTY = 0;
          }
        }
      }

      if (oOrder.agv_status === 0) {
        // Check if exist any task ok this order
        aAgvTasks = await app.service('agv-tasks').find({
          query: {
            order_id: sDoCode,
          },
        });

        if (aAgvTasks.total) {
          // Get the general config to parse the checks
          const config = await app.service('configs').find({
            query: {
              slug: {
                $in: ['agv-api'],
              },
            },
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
                order_amount: 0,
                order_list: [],
              },
            },
            iCount = 0,
            aReceiptList = [];

          if (aAgvTasks.total) {
            for (let oSingle of aAgvTasks.data) {
              if (oSingle.status === 1) {
                iCount++;
                aReceiptList.push({
                  cancel_date: new Date().getTime(),
                  owner_code: oConfig.headers.user_id,
                  out_order_code: oSingle.receipt_code,
                  remark: 'Cancel by WES System',
                  warehouse_code: oConfig.headers.warehouse_code,
                });
                await app
                  .service('agv-tasks')
                  .patch(oSingle._id, { cancel_on_finish: true }, params);
              }
            }
          }

          oAGVData.body.order_amount = iCount;
          oAGVData.body.order_list = aReceiptList;
          const response = await axios({
            method: 'POST',
            url: `${oConfig.url}/geekplus/api/artemis/pushJson/outOrderCancel?${oConfig.query}`,
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
            },
            data: oAGVData,
          });

          if (response.status === 201 || response.status === 200) {
            const { header } = response.data;

            if (header.msgCode === '200') {
              oNewData.agv = oOrder.agv;

              for (let oSingle of oNewData.agv) {
                oSingle.CANCEL_FLAG = 'Y';
                oSingle.STATUS = 304;
                oSingle.PICK_QTY = 0;
              }
            } else {
              sAGVStatus = 'fail';
            }
          } else {
            oNewData.status = 5;
            sAGVStatus = 'fail';
          }

          await app.service('wms-logs').create({
            type: oOrder.type,
            from: {
              text: 'WES',
              domain: params.ip,
            },
            to: {
              text: 'AGV',
              domain: oConfig.url,
            },
            order_id: oOrder.order_id,
            command: 'agvs/cancel',
            request: oAGVData,
            reply: response.data,
            created_by: user._id.toString(),
            status: sAGVStatus === 'success' ? 1 : 0,
          });
        }
      }

      if (sAGFStatus === 'success' || sAGVStatus === 'success') {
        oNewData.cancel_on_finish = true;
      }

      if (sAGFStatus === 'fail' && sAGVStatus === 'fail') {
        // Update order lines of the corresponding items
        await app.service('orders').patch(oOrder._id, oNewData, params);

        oResult = {
          AGFresult: 'fail',
          AGVresult: 'fail',
          errno: 1,
          message: 'AGV and AGF cancel failed',
        };
      } else if (sAGFStatus === 'success' || sAGVStatus === 'success') {
        // Release stocks and pallets
        params.provider = 'rest';
        if (sAGFStatus === 'success' && oOrder.agf_pallets) {
          if (oOrder.agf_pallets.length) {
            await app.service('scan-pallet').create(
              {
                order_id: sDoCode,
                pallet_id: oOrder.agf_pallets.join(','),
                operation: 'release',
              },
              params,
            );
          }
        }

        params.provider = undefined;
        // Update the order lines of the corresponding items
        await app.service('orders').patch(oOrder._id, oNewData, params);

        if (sAGVStatus === 'success' && aAgvTasks.total) {
          // Update agv task status
          for (let oSingle of aAgvTasks.data) {
            await app
              .service('agv-tasks')
              .patch(oSingle._id, { status: 3 }, params);
          }
        }

        if (sAGFStatus === 'success' && aAgfTasks.total) {
          // Update agf task status
          for (let oSingle of aAgfTasks.data) {
            await app
              .service('agf-tasks')
              .patch(oSingle._id, { status: 5 }, params);
          }
        }

        if (sAGFStatus === 'fail') {
          oResult = {
            AGFresult: 'fail',
            AGVresult: 'success',
            errno: 1,
            message:
              'AGV Cancel Success but AGF cancel failed. Task already executed',
          };
        } else if (sAGVStatus === 'fail') {
          oResult = {
            AGFresult: 'success',
            AGVresult: 'fail',
            errno: 1,
            message:
              'AGF Cancel Success but AGV cancel failed. Task already executed',
          };
        } else {
          oResult = {
            errno: 0,
            message: 'Cancel Success',
            result: 'success',
          };
          oNewData.cancelled = true;
          oNewData.status = 5;
        }

        params.provider = undefined;
        // Update the orler lines of the corresponding items
        await app.service('orders').patch(oOrder._id, oNewData, params);

        if (sAGFStatus === 'success' || sAGVStatus === 'success') {
          checkIsOrderComplete(oOrder.order_id, app, params);
        }
        params.provider = 'rest';
      }
    } catch (err) {
      logger.error('[PickingsCancel/create] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
      oResult = {
        errno: 1,
        errors: err.errors || undefined,
        message: err.message || err,
        result: 'fail',
      };
    }

    params.provider = 'rest';
    return oResult;
  }
};
