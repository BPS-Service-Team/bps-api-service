const errors = require('@feathersjs/errors');

const { iterateKeyCond, iterateKeyExactly } = require('../../../utils/conditional');
const { getCustomOptions } = require('../custom.functions');
const Schema = require('../../../schemas/agfs.schema');
const operations = require('../../../utils/putaways');
const i18n = require('../../../utils/i18n');
const logger = require('../../../logger');

exports.AgfsFinish = class AgfsFinish {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    const app = this.app,
      { type } = this.options,
      user_id = params?.user?._id.toString() || undefined;

    let oResult = {};
    try {
      data.type = type;
      let response = await Schema.POST_SCHEMA.validate(data, getCustomOptions());

      if (response.error) {
        throw response.error.message;
      }

      // Get the original request for the AGF
      const aRegister = await app.service('agf-tasks').find({
          query: {
            task_no: data.task_no,
          }
        }),
        task = aRegister.data[0];

      if (!task) {
        throw `Could not find initial request with task id "${data.task_no}"`;
      } else if (task.status === 1) {
        throw 'Task hasn\'t yet been submitted to AGF Robot';
      } else if (task.status === 5) {
        throw 'Task is already canceled';
      }

      let zone;
      if (task.direction === 'in') {
        // Find the corresponding pickup zone
        const aZones = await app.service('pickup-zones').find({
          query: {
            label: task.location_source,
          }
        });
        zone = aZones.data[0];

        if (!zone) {
          throw `Pickup zone for "${task.location_source}" not found`;
        }
      }

      // Find the corresponding order
      let order;
      if (task.order_id !== 'RC888') {
        const aOrder = await app.service('orders').find({
          query: {
            order_id: task.order_id,
          },
        });
        order = aOrder.data[0];

        if (!order) {
          throw `Order not found "${task.order_id}"`;
        } else if (
          order.status !== 1 &&
          order.status !== 2 &&
          order.status !== 5 &&
          order.type !== 'picking' &&
          task.direction !== 'in'
        ) {
          throw `The order is not in status "in process"`;
        }
      }

      let aRegisterStocks = [], blnEnterRegister = false;
      if (task.direction === 'in' && task.order_id !== 'RC888') {
        // Find all stocks that contain the order id
        const stocks = await app.service('stocks').Model.find({
            stocks: {
              $elemMatch: {
                ORDER_ID: order.order_id,
              }
            }
          }).lean(),
          aTargetStock = await app.service('stocks').find({
            query: {
              label: task.location_destination,
              $limit: 1,
            }
          }),
          target = aTargetStock.data[0];

        if (!target) {
          throw `The stock with label "${task.location_destination}" is not reserved`;
        }

        let aTotalStocks = [];
        for (let oRecord of stocks) {
          aTotalStocks = aTotalStocks.concat(oRecord.stocks || []);
        }

        // Register the stock
        for (let oSingle of task.request) {
          blnEnterRegister = true;
          let oExist = aTotalStocks.find(
            item => (item.STOCK_NO === oSingle.STOCK_NO &&
              item.ITM_NAME === oSingle.ITM_NAME &&
              item.BATCH_NO === oSingle.BATCH_NO &&
              item.SERIAL_NO === oSingle.SERIAL_NO &&
              item.PACK_KEY === oSingle.PACK_KEY &&
              item.VAL_TYPE === oSingle.VAL_TYPE &&
              item.ORDER_ID === order.order_id &&
              item.TASK_NO === data.task_no)
          );

          if (!oExist) {
            aRegisterStocks.push({
              TASK_NO: data.task_no,
              ORDER_ID: oSingle?.ORDER_ID || order.order_id,
              STOCK_NO: oSingle.STOCK_NO,
              PACK_KEY: oSingle.PACK_KEY,
              ITM_NAME: oSingle.ITM_NAME,
              BATCH_NO: oSingle.BATCH_NO,
              SERIAL_NO: oSingle.SERIAL_NO,
              VAL_TYPE: oSingle.VAL_TYPE,
              QTY: oSingle.QTY,
              DATE: oSingle?.DATE || new Date(),
            });
          }
        }

        if (!aRegisterStocks.length && !blnEnterRegister) {
          for (let oSingle of task.request) {
            aRegisterStocks.push({
              TASK_NO: data.task_no,
              ORDER_ID: order.order_id,
              STOCK_NO: oSingle.STOCK_NO,
              PACK_KEY: oSingle.PACK_KEY,
              ITM_NAME: oSingle.ITM_NAME,
              BATCH_NO: oSingle.BATCH_NO,
              SERIAL_NO: oSingle.SERIAL_NO,
              VAL_TYPE: oSingle.VAL_TYPE,
              QTY: oSingle.QTY,
              DATE: new Date(),
            });
          }
        }

        if (aRegisterStocks.length) {
          let oExtra = {};
          if (order.type === 'picking' && target.status === 203) {
            oExtra.status = 201;
          }

          await app.service('stocks').patch(target._id, {
            $push: {
              stocks: aRegisterStocks
            },
            updated_by: user_id,
            ...oExtra,
          }, params);

          if (order.type !== 'picking') {
            // Save transaction information
            await app.service('transactions').create({
              order_id: order.order_id,
              process: order.type,
              from: task.location_source,
              to: task.location_destination,
              pallet_id: target.pallet_id,
              items: aRegisterStocks.map(item => {
                return {
                  qty: item.QTY,
                  stock_no: item.STOCK_NO,
                  batch_no: item.BATCH_NO,
                  val_type: item.VAL_TYPE,
                  pack_key: item.PACK_KEY,
                };
              }),
              created_by: task?.created_by.toString() || params?.user._id.toString(),
            });
          }
        }

        const aAGFItems = order.agf;
        let blnNeedUpdate = false;
        for (let oCopy of aRegisterStocks) {
          let oItem = aAGFItems.find(
            item => ['putaway', 'return'].indexOf(order.type) > -1 ? iterateKeyExactly(
              item, oCopy,
              ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
            ) : iterateKeyCond(
              item, oCopy,
              ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
            ));

          let oTaskItem = task.request.find(
            item => ['putaway', 'return'].indexOf(order.type) > -1 ? iterateKeyExactly(
              item, oCopy,
              ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
            ) : iterateKeyCond(
              item, oCopy,
              ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
            ));

          if (oItem) {
            blnNeedUpdate = true;

            oItem.PA_QTY = (oItem.PA_QTY || 0) + oCopy.QTY;
            oItem.SHORT_COMING = oTaskItem?.SHORT_COMING || false;
          }
        }

        if (blnNeedUpdate) {
          await app.service('orders').patch(
            order._id,
            { agf: aAGFItems, updated_by: user_id },
            {
              ...params,
              provider: undefined,
            },
          );
        }
      } else if (task.direction === 'out') {
        let target;
        if (task.order_id !== 'RC888') {
          const aSourceTarget = await app.service('stocks').find({
            query: {
              label: task.location_source,
              $limit: 1,
            },
          });
          target = aSourceTarget.data[0];

          if (!target) {
            throw `The pallet ${task.location_source} wasn't found in stock`;
          }
        }

        // Checkout from stock
        let aInexisting = [];
        if (target?.stocks) {
          for (let oSingle of target.stocks) {
            let oExist = task.request.find(
              item => (item.STOCK_NO === oSingle.STOCK_NO &&
                item.ITM_NAME === oSingle.ITM_NAME &&
                item.BATCH_NO === oSingle.BATCH_NO &&
                item.SERIAL_NO === oSingle.SERIAL_NO &&
                item.PACK_KEY === oSingle.PACK_KEY &&
                item.VAL_TYPE === oSingle.VAL_TYPE)
            );

            if (!oExist) {
              aInexisting.push(oSingle.STOCK_NO);
            }
          }
        }

        if (aInexisting.length) {
          throw new errors.BadRequest(
            `The stock number ${aInexisting.join(', ')} wasn't exist in stocks`
          );
        }
      }

      if (order?.type === 'relocation') {
        let aDetails = order.details.map(oDetail => {
          const { payload } = oDetail;
          let oExist = aRegisterStocks.find(
            item => (item.BATCH_NO === payload.FR_BATCH_NO &&
              item.ITM_NAME === payload.ITM_NAME &&
              item.PACK_KEY === payload.PACK_KEY &&
              item.SERIAL_NO === payload.SERIAL_NO &&
              item.VAL_TYPE === payload.FR_VAL_TYPE)
          );

          if (oExist) {
            oDetail.status = 1;
          }

          delete oDetail._id;
          return oDetail;
        });

        await app.service('orders').patch(order._id, { details: aDetails, updated_by: user_id });
      }

      // Update the task
      await app.service('agf-tasks').patch(task._id, {
        updated_by: user_id,
        status: type === 'cancel' ? 5 : 4, // finish
      }, params);

      if (order?.type !== 'picking' && task.order_id !== 'RC888') {
        operations.checkIsOrderComplete(order.order_id, app, params);
      }

      // Free the AGF robot
      if (task.agf_id) {
        await app.service('agfs').patch(task.agf_id, {
          updated_by: user_id,
          status: 0, // idle
        }, params);
      }

      // Free pickup zone
      if (zone) {
        await app.service('pickup-zones').patch(zone._id, {
          updated_by: user_id,
          status: 1, // finish
        }, params);
      }

      operations.checkPendingTasks(app, params);

      oResult = {
        errno: 0,
        message: i18n.single('insert_record_success'),
        result: 'success',
      };
    } catch (err) {
      logger.error('[AgfsFinish/create] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
      oResult = {
        errno: 1,
        message: err.message || err,
        result: 'fail',
        errors: err.errors || undefined,
      };
    }

    params.provider = 'rest';
    return oResult;
  }
};
