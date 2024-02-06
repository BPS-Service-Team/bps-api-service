const joiOptions = require('../../../utils/joi.options').options();
const { checkIsOrderComplete } = require('../../../utils/putaways');
const { errors } = require('@feathersjs/errors');
const Schema = require('../../../schemas/putaways.schema');
const i18n = require('../../../utils/i18n');
const logger = require('../../../logger');

exports.PutawaysForceFinish = class PutawaysForceFinish {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    let oValidation, oResult;
    const app = this.app;

    try {
      delete data.created_by;
      oValidation = await Schema.FORCE_FINISH_SCHEMA.validate(data, joiOptions);

      if (oValidation.error) {
        throw oValidation.error.message;
      }

      params.provider = undefined;
      const aOrders = await app.service('orders').find({
        query: {
          order_id: data.order_id,
        },
      });
      const oOrder = aOrders.data[0];

      if (!oOrder) {
        throw new errors.BadRequest('Order not found');
      }

      let aAGFItems = oOrder.agf.map(oItem => {
        if (!oItem.PA_QTY) {
          oItem.PA_QTY = 0;
          oItem.SHORT_COMING = true;
        } else {
          if (oItem.PA_QTY < oItem.SUG_PA_QTY) {
            oItem.SHORT_COMING = true;
          }
        }

        return oItem;
      });

      let oPatchResult = await app.service('orders').patch(
        oOrder._id,
        {
          agf: aAGFItems,
          status: 3,
        },
        {
          ...params,
          provider: undefined,
        },
      );

      checkIsOrderComplete(data.order_id, app, params);

      oResult = {
        data: oPatchResult,
        errno: 0,
        message: i18n.single('insert_record_success'),
        result: 'success',
      };
    } catch (error) {
      logger.error('[PutawaysForceFinish/create] Error: %s', error.message || (typeof error === 'string' ? error : JSON.stringify(error)));
      oResult = {
        code: 500,
        errno: 1,
        errors: error.errors || undefined,
        message: error.message,
        path: error.data?.path || params.path,
        result: 'fail',
      };
    }

    return oResult;
  }
};
