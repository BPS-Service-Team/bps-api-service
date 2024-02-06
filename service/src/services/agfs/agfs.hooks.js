const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow, iff, isProvider } = require('feathers-hooks-common');
const validate = require('@feathers-plus/validate-joi');

const joiOptions = require('../../utils/joi.options').options();
const Schema = require('../../schemas/agfs.schema');
const Utils = require('../../utils');

const stickyMessagesCode = iff(
  isProvider('rest'),
  async context => {
    const { method, result } = context;

    let blnGetCodes = true;
    if (method === 'find') {
      if (!result.total) {
        blnGetCodes = false;
      }
    }

    if (blnGetCodes) {
      const codes = await Utils.findOne(context, 'configs', {
        query: {
          slug: 'error-codes',
          $limit: 1,
        }
      });

      if (codes) {
        if (method === 'get' || method === 'patch') {
          result.message_code = codes.elements.find(
            el => el.slug === result.code
          )?.value || 'Unknown';
        } else {
          for (let single of result.data) {
            single.message_code = codes.elements.find(
              el => el.slug === single.code
            )?.value || 'Unknown';
          }
        }
      }
    }
  },
);

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [],
    create: [validate.form(Schema.ROBOT_SCHEMA, joiOptions)],
    update: [disallow()],
    patch: [validate.form(Schema.ROBOT_PATCH_SCHEMA, joiOptions)],
    remove: [],
  },

  after: {
    all: [],
    find: [stickyMessagesCode],
    get: [stickyMessagesCode],
    create: [],
    update: [],
    patch: [stickyMessagesCode],
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
