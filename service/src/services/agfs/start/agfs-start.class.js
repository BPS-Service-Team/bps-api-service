const Schema = require('../../../schemas/agfs.schema');
const i18n = require('../../../utils/i18n');
const { getCustomOptions } = require('../custom.functions');
const logger = require('../../../logger');

exports.AgfsStart = class AgfsStart {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    const app = this.app,
      { type } = this.options,
      { taskNo, deviceName, lpn } = data.payload,
      user_id = params?.user?._id.toString() || undefined;

    let oResult = {};
    try {
      data.type = type;
      const response = await Schema.POST_SCHEMA.validate(data, getCustomOptions());
      if (response.error) {
        throw response.error.message;
      }

      // Check if the device name already exist
      const agf = await app.service('agfs').find({
        query: {
          device_name: deviceName,
          $limit: 1,
        }
      });
      let oAgf;

      // If not exist, then create it
      if (!agf.total) {
        oAgf = await app.service('agfs').create({
          device_name: deviceName,
          lpn,
          status: 1, // busy
        }, params);
      } else {
        oAgf = agf.data[0];
      }

      // Find the task to update the corresponding AGF
      let aTask = await app.service('agf-tasks').find({
          query: {
            task_no: taskNo,
            $limit: 1,
          }
        }),
        oTask = aTask.data[0];

      if (!oTask) {
        throw 'Task not found';
      } else if (oTask.status === 1) {
        throw 'Task hasn\'t yet been submitted to AGF Robot';
      } else if (oTask.status === 5) {
        throw 'Task is already canceled';
      }

      let aOrder = await app.service('orders').find({
          query: {
            order_id: oTask.order_id,
            $limit: 1,
            $select: ['_id', 'status'],
          }
        }),
        oOrder = aOrder.data[0];

      if (!oOrder && oTask.order_id !== 'RC888') {
        throw `The order "${oTask.order_id}" not found`;
      }

      // Update the task
      await app.service('agf-tasks').patch(oTask._id, {
        agf_id: oAgf._id.toString(),
        updated_by: user_id,
        status: 2,
      }, params);

      // Update order status
      if (oOrder) {
        if (oOrder.status !== 5) {
          await app.service('orders').patch(oOrder._id, {
            updated_by: user_id,
            status: 2,
          }, { ...params, provider: undefined });
        }
      }

      // If robot is not in busy status, change it
      if (oAgf.status !== 1) {
        await app.service('agfs').patch(oAgf._id, {
          updated_by: user_id,
          status: 1, // busy
        }, params);
      }

      oResult = {
        errno: 0,
        message: i18n.single('insert_record_success'),
        result: 'success',
      };
    } catch (err) {
      logger.error('[AgfsStart/create] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
      oResult = {
        errno: 1,
        message: err.message || err,
        result: 'fail',
        errors: err.errors || undefined,
      };
    }

    return oResult;
  }
};
