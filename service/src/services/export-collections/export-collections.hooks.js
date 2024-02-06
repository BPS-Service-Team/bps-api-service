const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow, iff, isProvider } = require('feathers-hooks-common');
const errors = require('@feathersjs/errors');

const fnRecursiveAnalyze = (aData, ObjectId) => {
  for (let oRow of aData) {
    for (let sKey in oRow) {
      if (typeof oRow[sKey] === 'object') {
        if (Array.isArray(oRow[sKey])) {
          fnRecursiveAnalyze(oRow[sKey], ObjectId);
        } else if (ObjectId.isValid(oRow[sKey])) {
          oRow[sKey] = {
            '$oid': oRow[sKey].toString(),
          };
        } else if (oRow[sKey] instanceof Date) {
          oRow[sKey] = {
            '$date': oRow[sKey].toISOString(),
          };
        }
      }
    }
  }
};

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [disallow()],
    get: [],
    create: [disallow()],
    update: [disallow()],
    patch: [disallow()],
    remove: [disallow()],
  },

  after: {
    all: [],
    find: [],
    get: [
      iff(
        isProvider('rest'),
        async context => {
          const { id } = context,
            { query } = context.params,
            mongooseClient = context.app.get('mongooseClient'),
            ObjectId = mongooseClient.Types.ObjectId,
            model = mongooseClient.models[id];

          if (!model) {
            throw new errors.BadRequest(`Model "${id}" doesn't exist`);
          }

          let allData;
          
          if (query?.order_id) {
            allData = await model.find({
              order_id: {
                $regex: query.order_id,
              },
            }).lean();
          } else {
            allData = await model.find().lean();
          }

          fnRecursiveAnalyze(allData, ObjectId);
          context.result = {
            id,
            data: allData,
          };
        },
      )
    ],
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
