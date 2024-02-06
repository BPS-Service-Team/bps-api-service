const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow, iff, isProvider } = require('feathers-hooks-common');

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [disallow()],
    create: [disallow()],
    update: [disallow()],
    patch: [disallow()],
    remove: [disallow()],
  },

  after: {
    all: [],
    find: [
      iff(
        isProvider('rest'),
        async context => {
          const mongooseClient = context.app.get('mongooseClient'),
            model = mongooseClient.models['transactions'],
            { query } = context.params;

          let oMatch = {};
          for (let sKey in query) {
            if (['limit', 'skip'].indexOf(sKey) > -1) {
              continue;
            }

            if (['stock_no', 'batch_no', 'val_type', 'pack_key'].indexOf(sKey) > -1) {
              oMatch[`items.${sKey}`] = {
                $regex: query[sKey],
                $options: 'i',
              };
            } else if (!isNaN(query[sKey])) {
              oMatch[sKey] = parseInt(query[sKey]);
            } else if (sKey === 'created_at') {
              oMatch[sKey] = {
                $gte: new Date(query[sKey].$gte),
                $lte: new Date(query[sKey].$lte)
              };
            } else {
              oMatch[sKey] = query[sKey];
            }
          }

          query.limit = query.limit === undefined ? 10 : parseInt(query.limit, 10);
          query.skip = query.skip === undefined ? 0 : parseInt(query.skip, 10);

          const result = await model.aggregate([
            { $unwind: '$items' },
            { $match: oMatch },
            {
              $lookup: {
                from: 'users',
                localField: 'created_by',
                foreignField: '_id',
                as: 'user'
              }
            },
            { $sort: { created_at: -1 } },
            { $limit: query.skip + query.limit },
            { $skip: query.skip }
          ]);

          const count = await model.aggregate([
            { $unwind: '$items' },
            { $match: oMatch },
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0 } }
          ]);

          let data = [];
          for (let record of result) {
            const { items, user } = record;

            data.push({
              _id: record._id,
              batch_no: items.batch_no,
              from: record.from,
              order_id: record.order_id,
              pack_key: items.pack_key,
              pallet_id: record.pallet_id,
              process: record.process,
              qty: items.qty,
              reason: record.reason,
              remarks: record.remarks,
              stock_no: items.stock_no,
              to: record.to,
              user: user[0].full_name,
              val_type: items.val_type,
              created_at: record.created_at,
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
    get: [],
    create: [],
    update: [],
    patch: [],
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
