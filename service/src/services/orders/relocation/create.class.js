const joiOptions = require('../../../utils/joi.options').options();
const Schema = require('../../../schemas/stock-relocation.schema');
const { createRelocation } = require('../../../utils/relocation');
const logger = require('../../../logger');

exports.RelocationCreate = class RelocationCreate {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    let oResult;

    try {
      const app = this.app;
      delete data.created_by;
      let oValidation = await Schema.CREATE_SCHEMA.validate(data, joiOptions);

      if (oValidation.error) {
        throw oValidation.error.message;
      }

      oResult = await createRelocation(app, data, params);
    } catch (err) {
      logger.error('[RelocationCreate/create] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
      oResult = {
        code: 500,
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
