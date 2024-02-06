const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow, iff, isProvider } = require('feathers-hooks-common');
const errors = require('@feathersjs/errors');
const validate = require('@feathers-plus/validate-joi');

const joiOptions = require('../../utils/joi.options').options();
const Schema = require('../../schemas/stock-report.schema');
const Utils = require('../../utils');

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [],
    create: [validate.form(Schema.POST_SCHEMA, joiOptions)],
    update: [disallow()],
    patch: [],
    remove: [],
  },

  after: {
    all: [],
    find: [
      iff(
        isProvider('rest'),
        async context => {
          const mongooseClient = context.app.get('mongooseClient'),
            model = mongooseClient.models['stocks'],
            { query } = context.params;

          let oMatch = {
            pallet_id: {
              $exists: true,
              $nin: [null, ''],
            }
          };

          if (query?.status === '100') {
            delete query.status;
            oMatch.stocks = null;
          }

          if (query.pallet_id) {
            oMatch = {};
            oMatch.$and = [
              {
                pallet_id: {
                  $exists: true,
                  $nin: [null, ''],
                }
              },
              {
                pallet_id: query.pallet_id,
              }
            ];
          }
          if (query.stock_issue) {
            oMatch['$and'] = [
              {
                pallet_id: {
                  $exists: true,
                }
              },
              {
                pallet_id: {
                  $nin: [null, ''],
                }
              }
            ];
            oMatch['stocks'] = null;
          }

          let oSecond = {};
          for (let sKey in query) {
            if (['limit', 'skip', 'pallet_id', 'stock_issue'].indexOf(sKey) > -1) {
              continue;
            }
            if (sKey === 'itm_name' || sKey === 'stock_no' || sKey === 'batch_no') {
              oSecond[`stocks.${sKey.toUpperCase()}`] = {
                $regex: query[sKey],
                $options: 'i',
              };
            } else if (!isNaN(query[sKey])) {
              oSecond[sKey] = parseInt(query[sKey]);
            } else {
              oSecond[sKey] = query[sKey];
            }
          }

          query.limit = query.limit === undefined ? 10 : parseInt(query.limit, 10);
          query.skip = query.skip === undefined ? 0 : parseInt(query.skip, 10);

          let result, count;
          if (oMatch.stocks === null) {
            result = await model.aggregate([
              { $match: {...oMatch, ...oSecond} },
              { $limit: query.skip + query.limit },
              { $skip: query.skip }
            ]);
            count = await model.aggregate([
              { $match: {...oMatch, ...oSecond} },
              { $group: { _id: null, total: { $sum: 1 } } },
              { $project: { _id: 0 } }
            ]);
          } else {
            result = await model.aggregate([
              { $match: oMatch },
              { $unwind: '$stocks' },
              { $match: oSecond },
              { $limit: query.skip + query.limit },
              { $skip: query.skip }
            ]);
            count = await model.aggregate([
              { $match: oMatch },
              { $unwind: '$stocks' },
              { $match: oSecond },
              { $group: { _id: null, total: { $sum: 1 } } },
              { $project: { _id: 0 } }
            ]);
          }

          let data = [];
          for (let oItem of result) {
            const { stocks } = oItem;

            data.push({
              _id: stocks ? stocks._id : oItem._id,
              batch_no: stocks?.BATCH_NO,
              date: stocks?.DATE,
              itm_name: stocks?.ITM_NAME,
              location: oItem.label,
              pack_key: stocks?.PACK_KEY,
              pallet_id: oItem.pallet_id,
              qty: stocks?.QTY,
              status: oItem.status,
              stock_no: stocks?.STOCK_NO,
              val_type: stocks?.VAL_TYPE,
              updated_at: oItem.updated_at,
              empty_stock: stocks === undefined ? true : false,
            });
          }

          context.result = {
            total: count.length ? count[0].total : 0,
            limit: query.skip + query.limit,
            skip: query.skip,
            data,
          };
        },
      )
    ],
    get: [
      iff(
        isProvider('rest'),
        async context => {
          const { id } = context,
            mongooseClient = context.app.get('mongooseClient'),
            ObjectId = mongooseClient.Types.ObjectId,
            model = mongooseClient.models['stocks'];

          let result = await model.find({
            'stocks._id': ObjectId(id),
          }).lean();

          if (!result.length) {
            throw new errors.NotFound(
              `No record found for id '${id}'`
            );
          }

          let oSingle = result[0],
            oItem = oSingle.stocks.find(item => item._id.toString() === id);

          context.result = {
            _id: oItem._id,
            batch_no: oItem.BATCH_NO,
            date: oItem.DATE,
            itm_name: oItem.ITM_NAME,
            location: oSingle.label,
            pack_key: oItem.PACK_KEY,
            pallet_id: oSingle.pallet_id,
            qty: oItem.QTY,
            status: oSingle.status,
            stock_no: oItem.STOCK_NO,
            val_type: oItem.VAL_TYPE,
          };
        },
      ),
    ],
    create: [
      iff(
        isProvider('rest'),
        async context => {
          const { data } = context,
            { pallet_id, label } = data,
            { user } = context.params;

          let pallet = await Utils.findOne(context, 'stocks', {
            query: {
              pallet_id,
            }
          });

          let oUpdate = {};
          if (!pallet) {
            if (label) {
              // If pallet not found and label is present, add pallet to stock
              pallet = await Utils.findOne(context, 'stocks', {
                query: {
                  label,
                }
              });

              if (!pallet) {
                throw new errors.NotFound(`Stock location with the label "${label}" not found`);
              } else if (pallet.status !== 200) {
                throw new errors.BadRequest('Stock location isn\'t empty');
              } else {
                let sPrefix = pallet_id[0];

                if (['L', 'S'].indexOf(sPrefix) === -1) {
                  throw new errors.BadRequest(
                    `The size "${sPrefix}" of pallet "${pallet_id}" is not allowed`
                  );
                }

                if (sPrefix === 'L' && pallet.type !== 'Long') {
                  throw new errors.BadRequest('Target location stock not support the pallet size');
                }
                oUpdate.pallet_id = pallet_id;
                oUpdate.status = 201;
              }
            } else {
              throw new errors.NotFound('Pallet ID not found');
            }
          } else if (pallet.status !== 201) {
            throw new errors.BadRequest(
              `Palette cannot be modified because it's in status "${pallet.status}"`
            );
          }

          const item = await Utils.findOne(context, 'items', {
            query: {
              stock_no: data.stock_no,
              $limit: 1,
            }
          });

          if (!item) {
            throw new errors.NotFound('Item not found');
          }

          let aKeys = [
              'stock_no', 'pack_key', 'itm_name', 'batch_no',
              'serial_no', 'val_type', 'qty', 'date'
            ],
            oItemStock = {};

          for (let sKey of aKeys) {
            if (data[sKey] !== undefined) {
              oItemStock[sKey.toUpperCase()] = data[sKey];
            } else if (item[sKey] !== undefined) {
              oItemStock[sKey.toUpperCase()] = item[sKey];
            } else if (sKey === 'date') {
              oItemStock[sKey.toUpperCase()] = new Date();
            } else {
              oItemStock[sKey.toUpperCase()] = null;
            }
          }

          oUpdate.$push = {
            stocks: oItemStock,
          };

          const result = await context.app.service('stocks').patch(pallet._id, oUpdate, context.params);

          // Save transaction information
          await context.app.service('transactions').create({
            process: 'adjustment',
            to: result.label,
            pallet_id: result.pallet_id,
            items: [
              {
                qty: oItemStock.QTY,
                stock_no: oItemStock.STOCK_NO,
                batch_no: oItemStock.BATCH_NO,
                val_type: oItemStock.VAL_TYPE,
                pack_key: oItemStock.PACK_KEY,
              }
            ],
            reason: data.reason,
            remarks: data.remarks,
            created_by: user._id.toString(),
          });

          context.result = {
            _id: oItemStock._id,
            batch_no: oItemStock.BATCH_NO,
            date: oItemStock.DATE,
            itm_name: oItemStock.ITM_NAME,
            location: result.label,
            pack_key: oItemStock.PACK_KEY,
            pallet_id: result.pallet_id,
            qty: oItemStock.QTY,
            status: result.status,
            stock_no: oItemStock.STOCK_NO,
            val_type: oItemStock.VAL_TYPE,
          };
        },
      )
    ],
    update: [],
    patch: [
      validate.form(Schema.PATCH_SCHEMA, joiOptions),
      iff(
        isProvider('rest'),
        async context => {
          const { id, data } = context,
            { user } = context.params,
            mongooseClient = context.app.get('mongooseClient'),
            ObjectId = mongooseClient.Types.ObjectId,
            model = mongooseClient.models['stocks'];

          let result = await model.find({
            'stocks._id': ObjectId(id),
          }).lean();

          if (!result.length) {
            throw new errors.NotFound(
              `No record found for id '${id}'`
            );
          }

          const oSingle = result.length ? result[0] : undefined;
          data.qty = parseInt(data.qty, 10);
          let oFind = oSingle.stocks.find(item => item._id.toString() === id),
            blnRemoved = data.qty === 0,
            blnHaveItem = false,
            oTransaction,
            oSet = {
              updated_at: new Date(),
              updated_by: user._id,
            };

          if (!oFind) {
            throw new errors.BadRequest('Item cannot be found in stock');
          }

          for (let sKey in oFind) {
            if (data[sKey.toLowerCase()] !== undefined) {
              // Check if the item really change
              if (data[sKey.toLowerCase()] !== oFind[sKey]) {
                blnHaveItem = true;
                break;
              }
            }
          }

          if (blnHaveItem) {
            oTransaction = {
              process: 'adjustment',
              to: oSingle.label,
              pallet_id: oSingle.pallet_id,
              items: [
                {
                  qty: oFind.QTY > data.qty ? (
                    blnRemoved ? (0 - oFind.QTY) : (oFind.QTY - data.qty)
                  ) : (data.qty - oFind.QTY),
                  stock_no: oFind.STOCK_NO,
                  batch_no: oFind.BATCH_NO,
                  val_type: oFind.VAL_TYPE,
                  pack_key: oFind.PACK_KEY,
                }
              ],
              reason: data.reason,
              remarks: data.remarks,
              created_by: user._id.toString(),
            };

            if (!blnRemoved) {
              for (let sKey in oFind) {
                if (data[sKey.toLowerCase()] !== undefined) {
                  oFind[sKey] = data[sKey.toLowerCase()];
                }
              }
            }

            oSet.stocks = oSingle.stocks;
            if (blnRemoved) {
              let aNewStocks = [];

              for (let oItem of oSingle.stocks) {
                if (oItem._id.toString() !== id) {
                  aNewStocks.push(oItem);
                }
              }

              if (!aNewStocks.length) {
                oSet.stocks = [];
                oSet.pallet_id = '';
                oSet.status = 200;
              } else {
                oSet.stocks = aNewStocks;
              }
            }
          }

          if (data.status) {
            if (oSingle.status === 202) {
              oSet.status = data.status;
            } else {
              throw new errors.BadRequest(`Cannot change from status "${oSingle.status}" to "${data.status}"`);
            }
          }

          delete data['updated_by'];
          await model.updateOne(
            {
              '_id': result[0]._id,
            },
            {
              $set: oSet,
            }
          );

          if (oTransaction) {
            // Save transaction information
            await context.app.service('transactions').create(oTransaction);
          }

          context.result = {
            _id: oFind._id,
            batch_no: oFind.BATCH_NO,
            date: oFind.DATE,
            itm_name: oFind.ITM_NAME,
            location: oSingle.label,
            pack_key: oFind.PACK_KEY,
            pallet_id: oSingle.pallet_id,
            qty: oFind.QTY,
            status: oSingle.status,
            stock_no: oFind.STOCK_NO,
            val_type: oFind.VAL_TYPE,
          };
        }
      ),
    ],
    remove: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
};
