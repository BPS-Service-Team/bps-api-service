const errors = require('@feathersjs/errors');
const moment = require('moment');

exports.AgfsRemove = class AgfsRemove {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    const app = this.app,
      user_id = params?.user?._id.toString() || undefined;

    let oResult = {};

    try {
      if (!data?.task?.createdAt || !data.task?._id) {
        throw new errors.GeneralError('createdAt and taskId are requerid');
      }

      await app.service('agf-tasks').patch(data.task._id, {
        updated_by: user_id,
        status: 7, // Soft delete
      });

      oResult = {
        errno: 0,
        result: 'success',
      };
    } catch (err) {
      oResult = {
        errno: 1,
        result: 'fail',
        message: err.message || err,
      };
    }

    return oResult;
  }
};
