const errors = require('@feathersjs/errors');

const joiOptions = require('../../../utils/joi.options').options();
const { iterateKeyCond, iterateKeyExactly } = require('../../../utils/conditional');
const Schema = require('../../../schemas/pickings.schema');
const pickingOp = require('../../../utils/pickings');
const i18n = require('../../../utils/i18n');
const Utils = require('../../../utils');
const logger = require('../../../logger');

exports.PickingReady = class PickingReady {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    let oValidation, oResult;

    try {
      const { user } = params,
        { order_id, pallet_id, items, label: workstation_id, more_pallets } = data,
        app = this.app;

      delete data.created_by;
      oValidation = await Schema.READY_SCHEMA.validate(data, joiOptions);

      if (oValidation.error) {
        throw new errors.BadRequest('Data Invalid', {
          errors: Utils.fnParseErrors(oValidation.error),
          method: params.method,
          path: params.path,
          type: params.type,
        });
      }

      params.provider = undefined;
      let sSize = pallet_id[0];
      if (['L', 'S'].indexOf(sSize) === -1) {
        throw new errors.BadRequest(`The size "${sSize}" is not allowed`);
      }

      // Get picking order
      const aPickingOrder = await app.service('orders').find({
        query: {
          order_id,
          $limit: 1,
        },
      });

      if (!aPickingOrder.total) {
        throw new errors.BadRequest(
          `The order with ID "${order_id}" doesn't exist`
        );
      }

      // Find is the pallet Id already exists into stocks
      const aStocks = await app
        .service('stocks')
        .Model.find({
          pallet_id,
        })
        .lean();

      if (aStocks.length === 0) {
        throw new errors.BadRequest(
          `There is no reserved stock with pallet ID "${pallet_id}"`
        );
      } else if (aStocks.length > 1) {
        throw new errors.BadRequest(
          `There is more than one stock reserved with the pallet ID "${pallet_id}"`
        );
      }
      const sStockLabel = aStocks[0].label,
        order = aPickingOrder.data[0];

      // Remove quantities in the stocks
      let aRegisterStocks = [], oCurrentStock = aStocks[0],
        aReturned = [], blnNeedUpdate = false,
        aErrors = [], aWarnings = [];

      const aAGFItems = order.agf;
      for (let oRecord of aStocks) {
        let aTransactions = [];

        for (let oSingle of oRecord.stocks) {
          // change to look for specific keys
          let oExist;
          for (const oOrderLine of aAGFItems) {
            let aKeysToMatch = ['STOCK_NO'];
            if (oOrderLine.VAL_TYPE && oOrderLine.VAL_TYPE !== '') {
              aKeysToMatch.push('VAL_TYPE');
            }
            if (oOrderLine.BATCH_NO && oOrderLine.BATCH_NO !== '') {
              aKeysToMatch.push('BATCH_NO');
            }
            if (oOrderLine.PACK_KEY && oOrderLine.PACK_KEY !== '') {
              aKeysToMatch.push('PACK_KEY');
            }
            oExist = items.find(
              item => iterateKeyExactly(
                oSingle,
                item,
                ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
              )
            );
            if (oExist) {
              break;
            }
          }

          if (oExist && !oExist.isComplete) {
            oExist.ORIGINAL_QTY = oExist.QTY;
            oExist.QTY -= oSingle.QTY;
            if (oExist.ORIGINAL_QTY >= oSingle.QTY) {
              oSingle.QTY = 0;
            } else {
              oSingle.QTY -= oExist.ORIGINAL_QTY;
            }

            aTransactions.push({
              qty: oExist.ORIGINAL_QTY * -1,
              stock_no: oSingle.STOCK_NO,
              batch_no: oSingle.BATCH_NO,
              val_type: oSingle.VAL_TYPE,
              pack_key: oSingle.PACK_KEY,
              remain: oExist.QTY * -1,
            });

            let oItem = aAGFItems.find(
              item => iterateKeyExactly(
                item,
                oSingle,
                ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
              )
            );

            if (!oItem) {
              oItem = aAGFItems.find(
                item => iterateKeyCond(
                  item,
                  oSingle,
                  ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
                )
              );
            }

            if (oItem) {
              blnNeedUpdate = true;
              if (oItem?.PICK_QTY) {
                oItem.PICK_QTY += oExist.ORIGINAL_QTY;
              } else {
                oItem.PICK_QTY = oExist.ORIGINAL_QTY;
              }
            }

            if (oItem.PICK_QTY > oItem.SUG_PICK_QTY) {
              aErrors.push(
                `The ${oItem.PICK_QTY} "${oItem.STOCK_NO}" items you need to pick is higher than the ${oItem.STOCK_NO} you requested in the order.`
              );
            } else if (oItem.PICK_QTY === oItem.SUG_PICK_QTY) {
              oExist.isComplete = true;
            }
          }

          // When the qty left is gt 0 -> update the stock
          if (oSingle.QTY) {
            delete oSingle._id;
            aReturned.push({
              DATE: oSingle.DATE,
              ORDER_ID: oSingle.ORDER_ID,
              STOCK_NO: oSingle.STOCK_NO,
              ITM_NAME: oSingle.ITM_NAME,
              BATCH_NO: oSingle.BATCH_NO,
              PACK_KEY: oSingle.PACK_KEY,
              SERIAL_NO: oSingle.SERIAL_NO,
              VAL_TYPE: oSingle.VAL_TYPE,
              SHORT_COMING: oSingle.SHORT_COMING || false,
              QTY: oSingle.QTY,
            });
          }
        }

        aRegisterStocks.push({
          _id: oRecord._id,
          stocks: [],
          transactions: aTransactions,
          old_pallet: oRecord.pallet_id,
          status: aReturned.length ? 203 : 200, // Status 203 when a pallet has to return
          pallet_id: aReturned.length ? oRecord.pallet_id : '',
        });
      }

      if (aErrors.length) {
        throw new errors.BadRequest(aErrors.join('\n'));
      }

      for (let item of items) {
        if (item.QTY !== undefined && item.ORIGINAL_QTY !== undefined) {
          aWarnings.push(
            `Only ${item.QTY} of ${item.ORIGINAL_QTY} items could be subtracted corresponding to the item "${item.ITM_NAME} - ${item.STOCK_NO}"`,
          );
        }
      }

      let oOrderUpdate;
      if (blnNeedUpdate) {
        oOrderUpdate = await app.service('orders').patch(
          order._id,
          { agf: aAGFItems },
          {
            ...params,
            provider: undefined,
          },
        );
      }

      let hasMorePallets = more_pallets || false;
      if (!hasMorePallets) {
        await pickingOp.quickCheckOrderComplete(order, app, params);
      }

      if (aReturned.length) {
        // Set data for Agf Task creation
        let sTaskId = `T${new Date().getTime()}`,
          oAgfRequest = {
            order_id,
            direction: 'in',
            task_no: sTaskId,
            force_type: 'putaway',
            type: 'create',
            request: aReturned,
            payload: {
              lpn: workstation_id,
              taskNo: sTaskId,
              taskType: 'Inbound',
              locationSource: workstation_id,
              locationDestination: sStockLabel,
              palletType: sSize === 'S' ? '800' : '1000',
              checkWidth: 'N',
              checkHeight: 'N',
            },
            created_by: user._id.toString(),
          };

        const register = await app.service('agf-tasks').create(oAgfRequest);

        if (register.status === 'error') {
          throw new errors.BadRequest(
            `Something went wrong in AGF call. ${
              register.result.message || register.result
            }`
          );
        } else if (register.status === 'fail') {
          throw new errors.BadRequest(
            `AGF response with an error. Error (${register.result.errorCode}): ${register.result.errorMessage}`
          );
        } else {
          oResult = {
            agf_task_no: sTaskId,
          };
        }
      }

      for (let oStock of aRegisterStocks) {
        await app.service('stocks').patch(
          oStock._id,
          {
            stocks: oStock.stocks || [],
            status: oStock.status,
            pallet_id: oStock.pallet_id,
          },
          params
        );

        if (oStock.transactions.length) {
          // Save transaction information
          await app.service('transactions').create({
            order_id: order.order_id,
            process: order.type,
            from: sStockLabel,
            to: workstation_id,
            pallet_id: oStock.old_pallet,
            items: oStock.transactions,
            created_by: user._id.toString(),
          });
        }
      }

      oResult = {
        ...oResult,
        data: oCurrentStock,
        errno: 0,
        message: i18n.single('insert_record_success'),
        warnings: aWarnings.join('\n'),
        order: oOrderUpdate,
        result: 'success',
      };
    } catch (err) {
      logger.error('[PickingReady/create] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
      oResult = {
        code: 500,
        errno: 1,
        errors: err.errors || undefined,
        message: err.message,
        path: err.data?.path || params.path,
        result: 'fail',
      };
    }

    return oResult;
  }
};
