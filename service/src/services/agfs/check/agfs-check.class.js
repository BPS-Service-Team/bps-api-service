const { getCustomOptions } = require('../custom.functions');
const Schema = require('../../../schemas/agfs.schema');
const i18n = require('../../../utils/i18n');
const logger = require('../../../logger');

exports.AgfsCheck = class AgfsCheck {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    const app = this.app,
      { taskNo, checkWidthResult, checkHeightResult } = data.payload,
      user_id = params?.user?._id.toString() || undefined;

    let oResult = {};
    try {
      data.type = 'check';
      let response = await Schema.POST_SCHEMA.validate(data, getCustomOptions());

      if (response.error) {
        throw response.error.message;
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

      const aOrder = await app.service('orders').find({
          query: {
            order_id: oTask.order_id,
            $limit: 1,
          }
        }),
        order = aOrder.total ? aOrder.data[0] : undefined;

      if (!order) {
        throw `Order with ID "${oTask.order_id}" doesn't exist`;
      }

      // Update the task
      await app.service('agf-tasks').patch(oTask._id, {
        check_result: {
          height: checkHeightResult,
          width: checkWidthResult,
        },
        updated_by: user_id,
        status: 3, // check
      }, params);

      oResult = {
        errno: 0,
        message: i18n.single('insert_record_success'),
        result: 'success',
      };
    } catch (err) {
      logger.error('[AgfsCheck/create] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
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
