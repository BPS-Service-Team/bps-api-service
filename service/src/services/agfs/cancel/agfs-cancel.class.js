const errors = require('@feathersjs/errors');

const Schema = require('../../../schemas/agfs.schema');
const { getCustomOptions } = require('../custom.functions');
const Utils = require('../../../utils');
const operations = require('../../../utils/putaways');

exports.AgfsCancel = class AgfsCancel {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    const app = this.app,
      { task_no, operation } = data,
      user_id = params?.user?._id.toString() || undefined;

    let oResult = {},
      response = await Schema.CANCEL_WES_SCHEMA.validate(data, getCustomOptions());

    if (response.error) {
      throw new errors.BadRequest('Invalid data', {
        errors: Utils.fnParseErrors(response.error),
        type: params.type,
        path: params.path,
        method: params.method,
      });
    }

    // Find the task data and order
    const task = await app.service('agf-tasks').find({
      query: {
        task_no,
        status: {
          $nin: [5],
        },
        $limit: 1,
      }
    });

    if (!task.total) {
      throw new errors.NotFound(`Task with the No. '${task_no}' not found or it was already canceled`);
    }

    const oTask = task.data[0],
      order = await app.service('orders').find({
        query: {
          order_id: oTask.order_id,
          $limit: 1,
        }
      });

    if (!order.total) {
      throw new errors.NotFound(`The order id with the ID '${task.order_id}' not found`);
    }
    const oOrder = order.data[0];

    // Load the corresponding stock
    const stock = await app.service('stocks').find({
      query: {
        $or: [
          {
            pallet_id: oTask.location_destination,
          },
          {
            label: oTask.location_destination,
          }
        ],
        $limit: 1,
      },
    });

    let oStock;
    params.provider = undefined;
    // Release stock and order
    if (stock.total) {
      oStock = stock.data[0];

      // Update the pallets id's of the order
      if (!oOrder.agf_pallets) {
        oOrder.agf_pallets = [];
      }

      let oNewData = {
        agf_pallets: [],
        updated_by: user_id
      };
      for (let sExistId of oOrder.agf_pallets) {
        if (oStock.pallet_id !== sExistId) {
          oNewData.agf_pallets.push(sExistId);
        }
      }

      let oNewStock = {
        status: 200,
        updated_by: user_id,
      };

      // If the original order is a "picking" and task is "in"
      if (oOrder.type === 'picking' && oTask.direction === 'in') {
        // Return the stocks
        oNewStock.status = 201;
        oNewStock.stocks = oTask.request;
      } else {
        oNewStock.pallet_id = '';
      }

      let blnFreeStock = true;
      if (!operation) {
        oNewData.status = 1;
      } else if (operation === 'clean') {
        blnFreeStock = false;
      }

      // Otherwise release the stock and update order
      if (blnFreeStock) {
        await app.service('orders').patch(oOrder._id, oNewData, params);
        await app.service('stocks').patch(oStock._id, oNewStock);
      }
    }

    if (!operation) {
      if (oTask.location_source) {
        const pickups = await app.service('pickup-zones').find({
          query: {
            label: oTask.location_source,
            status: {
              $in: [2, 3],
            },
            $limit: 1,
          }
        });

        if (pickups.total) {
          // Free pickup zone
          await app.service('pickup-zones').patch(pickups.data[0]._id, {
            status: 1,
            updated_by: user_id,
          }, params);
        }
      }
    }

    await app.service('agf-tasks').patch(oTask._id, {
      status: 5,
      updated_by: user_id,
    }, params);

    await operations.checkPendingTasks(app, params);

    oResult = {
      result: 'success',
      message: 'Task was successfully canceled'
    };

    params.provider = 'rest';
    return oResult;
  }
};
