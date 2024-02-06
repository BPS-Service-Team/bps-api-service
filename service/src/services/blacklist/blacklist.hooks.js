const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [disallow('rest')],
    create: [disallow('rest')],
    update: [disallow()],
    patch: [disallow()],
    remove: [disallow('rest')],
  },

  after: {
    all: [],
    find: [],
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
