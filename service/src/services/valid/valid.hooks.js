const { authenticate } = require('@feathersjs/authentication').hooks;
const { protect } = require('@feathersjs/authentication-local').hooks;
const { disallow } = require('feathers-hooks-common');
const errors = require('@feathersjs/errors');

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [disallow()],
    get: [disallow()],
    create: [],
    update: [disallow()],
    patch: [disallow()],
    remove: [disallow()],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      async context => {
        const { user } = context.params;

        if (!user) {
          throw new errors.Forbidden(
            'The API key for the user is invalid',
            { label: 'API_INVALID_API_KEY' },
          );
        }

        context.result = {
          user,
        };
      },
      protect(
        'password', 'token_expires', 'token_password', 'token',
        'pass_changed', 'pass_expires', 'pass_attempts', 'pass_history'
      ),
    ],
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
