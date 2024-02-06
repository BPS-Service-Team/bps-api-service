const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow, iff, isProvider } = require('feathers-hooks-common');

const EXCLUDE_SRV = process.env.CONFIG_EXCLUDE_SRV || 'auth,services';

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
          const services = context.app.services,
            aList = Object.keys(services),
            aExclude = EXCLUDE_SRV.split(',');

          context.result = aList.filter(
            item => aExclude.indexOf(item) === -1
          ).sort();
        }
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
