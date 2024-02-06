const { disallow } = require('feathers-hooks-common');
const errors = require('@feathersjs/errors');

const i18n = require('../../utils/i18n');

module.exports = {
  before: {
    all: [],
    find: [disallow()],
    get: [disallow()],
    create: [],
    update: [disallow()],
    patch: [disallow()],
    remove: [disallow()]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [async context => {
      const { token } = context.data;

      if (!token) {
        throw new errors.BadRequest(
          i18n.single('verify_invalid'),
          { label: 'API_VERIFY_INVALID' },
        );
      }

      // We look for the user who has the token
      const user = await context.app.service('users').find({
        query: {
          status: 0,
          token,
          $limit: 1
        }
      });

      if (user.data.length) {
        // We update the user's status
        await context.app.service('users').patch(user.data[0]._id, {
          token: '',
          status: 1
        });
      } else {
        throw new errors.BadRequest(
          i18n.single('verify_invalid'),
          { label: 'API_VERIFY_INVALID' },
        );
      }

      return context;
    }],
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
