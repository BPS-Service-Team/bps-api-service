const joiOptions = require('../../../utils/joi.options').options();
const Schema = require('../../../schemas/pickings.schema');
const { createPicking } = require('../../../utils/pickings');
const logger = require('../../../logger');

exports.PickingsCreate = class PickingsCreate {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    let oValidation, oResult, sRelocation;

    try {
      const app = this.app;

      delete data.created_by;
      if (data.relocation) {
        sRelocation = data.relocation;
        delete data.relocation;
      }
      oValidation = await Schema.CREATE_SCHEMA.validate(data, joiOptions);

      if (oValidation.error) {
        throw oValidation.error.message;
      }

      oResult = await createPicking(app, data, params, sRelocation);
    } catch (err) {
      logger.error('[PickingsCreate/create] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
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
