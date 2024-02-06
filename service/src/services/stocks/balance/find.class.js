const balance = require('../../../utils/balance');
const logger = require('../../../logger');

exports.BalanceFind = class BalanceFind {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async find(params) {
    let oResult = {};

    try {
      const app = this.app;
      params.provider = undefined;
      oResult = await balance.getBalance(app);
    } catch (err) {
      logger.error('[BalanceFind/find] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
      oResult = {
        errno: 1,
        message: err.message || err,
        result: 'fail',
      };
    }

    params.provider = 'rest';
    return oResult;
  }
};
