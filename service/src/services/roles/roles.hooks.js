const { authenticate } = require('@feathersjs/authentication').hooks;
const validate = require('@feathers-plus/validate-joi');

const joiOptions = require('../../utils/joi.options').options();
const Schema = require('../../schemas/roles.schema');
const Utils = require('../../utils');

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [],
    create: [validate.form(Schema.POST_SCHEMA, joiOptions)],
    update: [validate.form(Schema.POST_SCHEMA, joiOptions)],
    patch: [validate.form(Schema.PATCH_SCHEMA, joiOptions)],
    remove: [async context => {
      const { id } = context;

      if (id) {
        let aRelated = [{
          service: 'menus',
          query: {
            query: {
              rol_id: id,
              $limit: 0
            }
          },
        }, {
          service: 'users',
          query: {
            query: {
              rol_id: id,
              $limit: 0
            }
          },
        }];

        await Utils.fnValidateRelated(context, aRelated);
      }
    }],
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
