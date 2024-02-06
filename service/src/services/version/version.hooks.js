const { authenticate } = require('@feathersjs/authentication').hooks;
const validate = require('@feathers-plus/validate-joi');
const { disallow } = require('feathers-hooks-common');
const errors = require('@feathersjs/errors');

const Schema = require('../../schemas/version.schema');
const options = {
  abortEarly: false,
  convert: true,
  getContext(context) {
    return context.params.query;
  },
  setContext(context, newValues) {
    Object.assign(context.params.query, newValues);
  },
};

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [validate.form(Schema.FIND_SCHEMA, options)],
    get: [disallow()],
    create: [disallow()],
    update: [disallow()],
    patch: [disallow()],
    remove: [disallow()],
  },

  after: {
    all: [],
    find: [async context => {
      let { type } = context.params.query,
        version = process.env[`${type.toUpperCase()}_VERSION`];

      if (!version) {
        throw new errors.NotFound(
          `Version of "${type.toUpperCase()}" not found`,
          { label: 'API_VERSION_NOT_FOUND', type: type.toUpperCase() },
        );
      }

      context.result = {
        version,
      };
    }],
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
