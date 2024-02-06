const { authenticate } = require('@feathersjs/authentication').hooks;
const validate = require('@feathers-plus/validate-joi');
const { disallow } = require('feathers-hooks-common');

const joiOptions = require('../../utils/joi.options').options();
const Schema = require('../../schemas/orders.schema');

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [
      async context => {
        const { query } = context.params;

        if (query.relocation) {
          if (query.relocation === 'null') {
            query.relocation = null;
          }
        }

        return context;
      }
    ],
    get: [],
    create: [disallow('rest'), validate.form(Schema.POST_SCHEMA, joiOptions)],
    update: [disallow()],
    patch: [disallow('rest'), validate.form(Schema.PATCH_SCHEMA, joiOptions)],
    remove: [],
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
