const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');
const validate = require('@feathers-plus/validate-joi');

const joiOptions = require('../../utils/joi.options').options();
const Schema = require('../../schemas/email-logs.schema');

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [],
    create: [validate.form(Schema.POST_SCHEMA, joiOptions)],
    update: [disallow()],
    patch: [disallow()],
    remove: [disallow()]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
