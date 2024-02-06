// Application hooks that run for every service
const { iff, isProvider } = require('feathers-hooks-common');

const log = require('./utils/log');
const authorize = require('./utils/abilities');
const customLog = require('./utils/custom-logs');
const authenticate = require('./strategies/authenticate');

/**
 * Sticky the control fields
 */
const stickyControlUsers = iff(
  isProvider('rest'),
  async context => {
    const { data, method } = context,
      { user } = context.params;

    if (user) {
      if (method === 'create') {
        data.created_by = user._id.toString();
      } else if (method === 'patch') {
        data.updated_by = user._id.toString();
      }
    }
  }
);

const recursiveLowerKeys = function (oTarget, oData) {
  for (let sKey in oData) {
    if (Array.isArray(oData[sKey])) {
      for (let i = 0; i < oData[sKey].length; i++) {
        recursiveLowerKeys(oTarget, oData[sKey][i]);
      }
    } else if (typeof oData[sKey] === 'object') {
      recursiveLowerKeys(oTarget, oData[sKey]);
    } else {
      oTarget[sKey.toLowerCase()] = oData[sKey];
    }
  }
};

/**
 * It's responsible to parse the keys of the data
 */
const lowersKeys = iff(
  isProvider('rest'),
  async context => {
    const { data, method, path } = context;

    if (method === 'create' || method === 'patch') {
      if (['items'].includes(path)) {
        const oOut = {};
        recursiveLowerKeys(oOut, data);
        context.data = oOut;
      }
    }
  },
);

module.exports = {
  before: {
    all: [
      iff(
        (hook) =>
          hook.params.provider &&
          `/${hook.path}` !== hook.app.get('authentication').path,
        [authenticate, authorize]
      ),
    ],
    find: [],
    get: [],
    create: [lowersKeys, stickyControlUsers],
    update: [],
    patch: [lowersKeys, stickyControlUsers],
    remove: [],
  },

  after: {
    all: [log()],
    find: [],
    get: [],
    create: [customLog],
    update: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [log()],
    find: [],
    get: [],
    create: [customLog],
    update: [],
    patch: [],
    remove: [],
  },
};
