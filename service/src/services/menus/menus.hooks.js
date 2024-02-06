const { authenticate } = require('@feathersjs/authentication').hooks;
const validate = require('@feathers-plus/validate-joi');

const joiOptions = require('../../utils/joi.options').options();
const Schema = require('../../schemas/menus.shcema');
const Utils = require('../../utils');

module.exports = {
  before: {
    all: [],
    find: [
      authenticate('jwt'),
      async context => {
        const { user, query } = context.params;

        if (query) {
          if (query.$parse !== undefined) {
            context.params.$parse = query.$parse;
            delete query.$parse;

            // Filter by user role
            if (user) {
              let { rol, rol_id } = user;

              if (rol !== 'admin' || !query.$limit) {
                query.rol_id = rol_id.toString();
              }
            } else {
              // In case you do not have a user, we send the menu by default
              const role = await Utils.findOne(context, 'roles', {
                query: {
                  group: 'guests',
                  $select: ['_id', 'group']
                }
              });

              if (role) {
                query.rol_id = role._id;
                delete query.$limit;
              }
            }
          }
        }

        return context;
      },
    ],
    get: [authenticate('jwt')],
    create: [authenticate('jwt'), validate.form(Schema.POST_SCHEMA, joiOptions), Utils.fnValidateRefIds],
    update: [authenticate('jwt'), validate.form(Schema.POST_SCHEMA, joiOptions)],
    patch: [authenticate('jwt'), validate.form(Schema.PATCH_SCHEMA, joiOptions), Utils.fnValidateRefIds],
    remove: [authenticate('jwt')],
  },

  after: {
    all: [],
    find: [async context => {
      const { $parse } = context.params,
        { result } = context;

      if ($parse) {
        context.result = result.data.length ? result.data[0].menus : {};
      }
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
