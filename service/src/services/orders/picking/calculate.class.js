const errors = require('@feathersjs/errors');

const joiOptions = require('../../../utils/joi.options').options();
const Schema = require('../../../schemas/pickings.schema');
const { iterateKeyExactly } = require('../../../utils/conditional');
const Utils = require('../../../utils');
const logger = require('../../../logger');

exports.PickingsCalculate = class PickingsCalculate {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    let oResult, oValidation;

    try {
      const { order_id } = data;
      const app = this.app;

      delete data.created_by;
      oValidation = await Schema.CALCULATE_SCHEMA.validate(data, joiOptions);

      if (oValidation.error) {
        throw new errors.BadRequest('Data Invalid', {
          errors: Utils.fnParseErrors(oValidation.error),
          method: params.method,
          path: params.path,
        });
      }

      let oExist = await app.service('orders').find({
          ...params,
          query: {
            order_id: order_id,
            $limit: 1,
          },
        }),
        aItems = [],
        oOrder = oExist.data[0];

      if (!oExist.total) {
        return {
          errno: 1,
          result: 'fail',
          message: 'Order not found',
        };
      }

      const { type: sOrderType } = oOrder;
      const blnIsRelocation = sOrderType === 'relocation';

      if (!blnIsRelocation) {
        aItems = aItems.concat(oOrder.agf);
      } else {
        aItems = oOrder.details.map((oDetail) => oDetail.payload);
      }

      const mongooseClient = app.get('mongooseClient'),
        model = mongooseClient.models.stocks;

      let aLeftItems = aItems.filter(oItem => !oItem.PICK_QTY || oItem.PICK_QTY < oItem.SUG_PICK_QTY);
      // build queries
      let aStockNo = aLeftItems.map(oElement => oElement.STOCK_NO).filter(sElement => sElement),
        aPackKey = aLeftItems.map(oElement => oElement.PACK_KEY).filter(sElement => sElement),
        aBatchNo = aLeftItems.map(oElement => !blnIsRelocation ? oElement.BATCH_NO : oElement.FR_BATCH_NO).filter(sElement => sElement),
        aValType = aLeftItems.map(oElement => !blnIsRelocation ? oElement.VAL_TYPE : oElement.FR_VAL_TYPE).filter(sElement => sElement);

      let aItemsForPick = [];
      let nErrorType = 0;
      if (aLeftItems.length) {
        let oInitialQueries = {};
        let aOrs = [];
        let oSecondQueries = {};
        if (aStockNo.length) {
          oInitialQueries['stocks.STOCK_NO'] = {
            $in: aStockNo,
          };
        }

        if (aPackKey.length) {
          let oQueries = {};
          oQueries['stocks.PACK_KEY'] = {
            $in: aPackKey,
          };
          aOrs.push(oQueries);
        }

        if (aBatchNo.length) {
          let oQueries = {};
          oQueries['stocks.BATCH_NO'] = {
            $in: aBatchNo,
          };
          oSecondQueries['stocks.BATCH_NO'] = {
            $in: aBatchNo,
          };
          aOrs.push(oQueries);
        }

        if (aValType.length) {
          let oQueries = {};
          oQueries['stocks.VAL_TYPE'] = {
            $in: aValType,
          };
          aOrs.push(oQueries);
        }

        let oSData = [];
        await model
          .aggregate([
            {
              $match: {
                $and: [
                  {
                    pallet_id: {
                      $exists: true,
                      $ne: [null, ''],
                    },
                    status: 201,
                  },
                  {
                    ...oInitialQueries
                  },
                  {
                    $or: aOrs,
                  }
                ],
              },
            },
            {
              $project: {
                pallet_id: 1,
                stocks: 1,
              },
            },
            {
              $unwind: '$stocks',
            },
            {
              $match: {
                $and: [
                  {
                    ...oInitialQueries,
                  },
                  {
                    $or: aOrs,
                  },
                ],
              },
            },
            {
              $group: {
                _id: '$pallet_id',
                stocks: {
                  $push: '$stocks',
                },
              },
            },
          ])
          .then(response => {
            oSData = response.map(oItem => ({
              pallet_id: oItem._id,
              stocks: oItem.stocks,
            }));
          });

        let aStocks = [];
        for (let oItem of oSData) {
          aStocks = aStocks.concat(oItem.stocks.map(item => {
            return {
              ...item,
              DATE: item.DATE ? item.DATE : new Date('2000-01-01'),
              PALLET_ID: oItem.pallet_id
            };
          }));
        }
        aStocks = aStocks.sort((a, b) => a.DATE - b.DATE);

        aLeftItems = aLeftItems.sort((a, b) => {
          let nOrder = 0;
          if (a.BATCH_NO === null) {
            nOrder++;
          }
          if (b.BATCH_NO === null) {
            nOrder--;
          }

          return nOrder;
        });

        let aErrors = [];
        aLeftItems.map(oItem => {
          let aKeysToMatch = ['STOCK_NO'];
          if (oItem.VAL_TYPE && oItem.VAL_TYPE !== '') {
            aKeysToMatch.push('VAL_TYPE');
          }
          if (oItem.BATCH_NO && oItem.BATCH_NO !== '') {
            aKeysToMatch.push('BATCH_NO');
          }
          if (oItem.PACK_KEY && oItem.PACK_KEY !== '') {
            aKeysToMatch.push('PACK_KEY');
          }
          let aFounded = aStocks.filter(
            item => iterateKeyExactly(
              oItem, item, aKeysToMatch
            ));

          if (!aFounded.length) {
            nErrorType = 3;
            aErrors.push(`Item ${oItem.STOCK_NO} not found in stocks`);
            return;
          }

          let nQty = 0,
            nQtyForPick = oItem.SUG_PICK_QTY - (oItem.PICK_QTY || 0),
            nRest = nQtyForPick;

          for (let oSingle of aFounded) {
            if (nQty < nQtyForPick) {
              nQty += oSingle.QTY;
              oSingle.PICK_QTY = nQty <= nQtyForPick ? oSingle.QTY : nRest;
              nRest -= oSingle.QTY;

              const nIndex = aItemsForPick.findIndex(oPallet => oPallet.pallet_id === oSingle.PALLET_ID);
              let sPalletId = oSingle.PALLET_ID;
              if (nIndex === -1) {
                aItemsForPick.push({
                  pallet_id: sPalletId,
                  stocks: [oSingle],
                });
              } else {
                const oSameStock = aItemsForPick[nIndex].stocks.find(
                  oE => oE._id.toString() === oSingle._id.toString()
                );

                if (oSameStock?.STOCK_NO === oItem.STOCK_NO && oItem.BATCH_NO === null) {
                  nErrorType = 3;
                  aErrors.push(
                    `Item ${oItem.STOCK_NO} with BATCH_NO ${oItem.BATCH_NO} has not enough QTY.`
                  );
                } else {
                  aItemsForPick[nIndex].stocks.push(oSingle);
                }
              }
            }
          }

          if (nQty < oItem.SUG_PICK_QTY) {
            aErrors.push(`There is no enough Qty of item ${oItem.STOCK_NO}`);
          }
        });

        // Clean pallets id from stock
        for (let oRow of aItemsForPick) {
          for (let oStock of oRow.stocks) {
            delete oStock['PALLET_ID'];
          }
        }

        if (aErrors.length) {
          if (nErrorType === 3) {
            return {
              data: aItemsForPick,
              errno: nErrorType,
              result: 'error',
              message: 'Error with items',
              errors: aErrors,
            };
          } else {
            return {
              data: aItemsForPick,
              errno: 2,
              errors: aErrors,
              message: 'Quantity not enough',
              result: 'error',
            };
          }
        }
      }

      oResult = {
        errno: 0,
        result: 'success',
        message: 'Items founded',
        data: aItemsForPick,
      };
    } catch (err) {
      logger.error('[PickingsCalculate/create] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
      oResult = {
        code: 500,
        errno: 1,
        message: err.message,
        result: 'fail',
        errors: err.errors || undefined,
      };
    }

    return oResult;
  }
};
