const errors = require('@feathersjs/errors');

const joiOptions = require('../../../utils/joi.options').options();
const Schema = require('../../../schemas/items.schema');
const Utils = require('../../../utils');

exports.ItemValidate = class ItemValidate {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    let oValidation;

    const app = this.app,
      { order_id, code } = data;

    delete data['created_by'];
    oValidation = await Schema.VALIDATE_QR_CODE.validate(data, joiOptions);

    if (oValidation.error) {
      throw new errors.BadRequest('Invalid data', {
        errors: Utils.fnParseErrors(oValidation.error),
        type: params.type,
        path: params.path,
        method: params.method,
      });
    }

    let [STOCK_NO, _, VAL_TYPE, SERIAL_NO, BATCH_NO] = code.split(';'),
      oFilter = {};

    if (STOCK_NO !== '' && STOCK_NO !== undefined) {
      oFilter.STOCK_NO = STOCK_NO;
    }

    if (VAL_TYPE !== '' && VAL_TYPE !== undefined) {
      oFilter.VAL_TYPE = VAL_TYPE;
    }

    if (SERIAL_NO !== '' && SERIAL_NO !== undefined) {
      oFilter.SERIAL_NO = SERIAL_NO;
    }

    if (BATCH_NO !== '' && BATCH_NO !== undefined) {
      oFilter.BATCH_NO = BATCH_NO;
    }

    const oModel = app.service('orders').Model,
      oExist = await oModel.find({
        order_id,
        $or: [{
          agv: {
            $elemMatch: oFilter
          }
        }, {
          agf: {
            $elemMatch: oFilter
          }
        }]
      });

    if (oExist.length) {
      return {
        result: true,
      };
    } else {
      throw new errors.NotFound('The item does not correspond to the order provided');
    }
  }
};
