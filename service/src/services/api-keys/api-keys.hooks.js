const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');
const validate = require('@feathers-plus/validate-joi');

const joiOptions = require('../../utils/joi.options').options();
const Schema = require('../../schemas/api-keys.schema');
const Utils = require('../../utils');

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [Utils.fnStickyUser],
    get: [Utils.fnStickyUser],
    create: [
      Utils.fnStickyUser,
      validate.form(Schema.POST_SCHEMA, joiOptions),
      Utils.fnValidateRefIds,
      async context => {
        context.data.api_key = await Utils.generateToken({ byteLength: 32 });
      }
    ],
    update: [disallow()],
    patch: [validate.form(Schema.PATCH_SCHEMA, joiOptions), Utils.fnValidateRefIds],
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
