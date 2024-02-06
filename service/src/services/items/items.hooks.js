const { authenticate } = require('@feathersjs/authentication').hooks;
const validate = require('@feathers-plus/validate-joi');
const { disallow } = require('feathers-hooks-common');

const joiOptions = require('../../utils/joi.options').options();
const Schema = require('../../schemas/items.schema');

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [],
    create: [validate.form(Schema.POST_SCHEMA, joiOptions)],
    update: [disallow()],
    patch: [validate.form(Schema.PATCH_SCHEMA, joiOptions)],
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
