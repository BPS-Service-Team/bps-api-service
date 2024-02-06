const joiOptions = require('../../../utils/joi.options').options();
const Schema = require('../../../schemas/stock-relocation.schema');
const logger = require('../../../logger');

exports.RelocationCancel = class RelocationCancel {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    let oValidation, oReturn = {};

    try {
      const app = this.app;

      delete data['created_by'];
      oValidation = await Schema.CANCEL_SCHEMA.validate(data, joiOptions);

      if (oValidation.error) {
        throw oValidation.error.message;
      }

      params.provider = undefined;
      let aSreList = data.SRE_LIST[0],
        aItems = aSreList.SRE_LIST_ITEM,
        sSlCode = aSreList.SRE_LIST_NO,
        sTrCode = sSlCode.split('-')[0],
        blnError = false;

      for (let oSingle of aItems) {
        if (oSingle.TR_CODE !== sTrCode) {
          blnError = true;
          break;
        }
      }

      if (blnError) {
        throw "Found order lines with different TR_CODE's";
      }

      // Check if order exists
      let oExist = await app.service('orders').find({
        ...params,
        query: {
          order_id: sTrCode,
          type: 'relocation',
        },
      });

      if (!oExist.total) {
        throw 'TR_CODE not  exists';
      }

      let oOrder = oExist.data[0];
      if (oOrder.cancelled) {
        throw 'Not Allowed. Order already cancelled before';
      }

      let aAgv = [],
        aAgf = [];

      // Search for sibling orders
      const aOrders = await app.service('orders').find({
        ...params,
        query: {
          relocation: oOrder.order_id,
        },
      });

      for (const order of aOrders.data) {
        aAgv = aAgv.concat(order.agv);
        aAgf = aAgf.concat(order.agf);
      }

      if (oOrder.status === 3) {
        params.provider = 'rest';
        return {
          errno: 1,
          AGVresult: aAgv.length ? 'fail' : 'success',
          AGFresult: aAgf.length ? 'fail' : 'success',
          message: 'Cancel fails. Order Finished',
        };
      }

      let blnCanCancel = true;
      for (let order of aOrders.data) {
        if (order.status > 1) {
          blnCanCancel = false;
        }
      }

      if (blnCanCancel) {
        // cancel sibling orders
        for (let order of aOrders.data) {
          await app.service('orders').patch(order._id, { status: 5 });

          const aAgfTasks = await app.service('agf-tasks').find({
            query: {
              order_id: order.order_id,
            }
          });

          if (aAgfTasks.total) {
            for (const oSingle of aAgfTasks.data) {
              await app.service('agf-tasks')
                .patch(oSingle._id, { status: 5 }, params);
            }
          }

          const aAgvTasks = await app.service('agv-tasks').find({
            query: {
              order_id: order.order_id,
            },
          });

          if (aAgvTasks.total) {
            for (const oSingle of aAgvTasks.data) {
              await app.service('agv-task')
                .patch(oSingle._id, { status: 3 }, params);
            }
          }
        }

        await app.service('orders').patch(oOrder._id, {
          cancelled: true,
          status: 5,
        });

        oReturn = {
          errno: 0,
          AGFresult: aAgf.length ? 'success' : 'fail',
          AGVresult: aAgv.length ? 'success' : 'fail',
          message: 'Cancel Success',
          result: 'success',
        };
      }

      oReturn = {
        errono: 1,
        AGFresult: aAgf.length ? 'fail' : 'success',
        AGVresult: aAgv.length ? 'fail' : 'success',
        message: 'Cancel Failed. Orders task already executed',
        result: 'fail',
      };
    } catch (err) {
      logger.error('[RelocationCancel/create] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
      oReturn = {
        errno: 1,
        result: 'fail',
        message: err.message || JSON.stringify(err),
      };
    }

    params.provider = 'rest';
    return oReturn;
  }
};
