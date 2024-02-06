const errors = require('@feathersjs/errors');

const joiOptions = require('../../../utils/joi.options').options();
const Schema = require('../../../schemas/pickings.schema');
const Utils = require('../../../utils');
const logger = require('../../../logger');

exports.PickingsProcessCalculate = class PickingsProcessCalculate {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    let oResult, oValidation;

    try {
      const { operation, pallets, calculate, order_id } = data;
      const app = this.app;

      delete data.created_by;
      oValidation = await Schema.PROCESS_CALCULATE_SCHEMA.validate(data, joiOptions);

      if (oValidation.error) {
        throw new errors.BadRequest('Data Invalid', {
          errors: Utils.fnParseErrors(oValidation.error),
          method: params.method,
          path: params.path,
        });
      }

      for (let sPallet of pallets) {
        let sSize = sPallet[0];
        if (['L', 'S'].indexOf(sSize) === -1) {
          throw new errors.BadRequest(
            `The size of pallet ${sPallet} is not allowed`
          );
        }
      }

      const aStocks = await app.service('stocks').find({
        query: {
          pallet_id: {
            $in: pallets,
          },
        }
      });

      if (!aStocks.total) {
        throw new errors.NotFound('Pallets not found');
      }

      // update
      let aUpdated = [];
      if (operation === 'reserve') {
        for (let oStock of aStocks.data) {
          if (oStock.status === 202) {
            throw new errors.BadRequest('Stock Occupied', {
              errors: [
                `Stock with pallet ${oStock.pallet_id} is busy`,
              ],
            });
          }
        }

        for (let oStock of aStocks.data) {
          let oResponse = await app.service('stocks').patch(
            oStock._id,
            {
              status: 202,
            },
          );
          if (oResponse) {
            aUpdated.push(oResponse);
          }
        }

        oResult = {
          updated: aUpdated,
        };
      } else if (operation === 'unlock') {
        for (let oStock of aStocks.data) {
          let oResponse = await app.service('stocks').patch(
            oStock._id,
            {
              status: 201,
            },
          );
          if (oResponse) {
            aUpdated.push(oResponse);
          }
        }
      }

      if (order_id) {
        const aOrder = await app.service('orders').find({
          query: {
            order_id,
            $select: ['_id', 'calculate'],
            $limit: 1,
          }
        });

        if (aOrder.data.length) {
          const order = aOrder.data[0];

          if (!order.calculate) {
            await app.service('orders').patch(order._id, {
              calculate,
            });
          }
        }
      }

      oResult = {
        ...oResult,
        errno: 0,
        result: 'success',
        message: `Stocks ${operation === 'reserve' ? 'Reserved' : 'Unlocked'}`,
      };
    } catch (error) {
      logger.error('[PickingsProcessCalculate/create] Error: %s', error.message || (typeof error === 'string' ? error : JSON.stringify(error)));
      oResult = {
        code: 500,
        errno: 1,
        message: error.message,
        result: 'fail',
        errors: error.errors || undefined,
      };
    }

    return oResult;
  }
};
