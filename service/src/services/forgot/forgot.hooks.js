const { disallow, iff, isProvider } = require('feathers-hooks-common');
const validate = require('@feathers-plus/validate-joi');
const errors = require('@feathersjs/errors');

const joiOptions = require('../../utils/joi.options').options();
const Schema = require('../../schemas/forgot.schema');
const i18n = require('../../utils/i18n');
const Utils = require('../../utils');

module.exports = {
  before: {
    all: [],
    find: [disallow()],
    get: [],
    create: [validate.form(Schema.POST_SCHEMA, joiOptions)],
    update: [disallow()],
    patch: [validate.form(Schema.PATCH_SCHEMA, joiOptions)],
    remove: [disallow()]
  },

  after: {
    all: [],
    find: [],
    get: [
      iff(
        isProvider('rest'),
        async context => {
          const { id } = context;

          // Search for the user and check that the token has not expired
          const user = await context.app.service('users').find({
            query: {
              status: 1,
              token_password: id,
              token_expires: {
                $gt: Date.now()
              }
            }
          });

          if (user.data.length) {
            context.result = {
              result: true
            };
          } else {
            throw new errors.BadRequest(
              i18n.single('forgot_token_invalid'),
              { label: 'API_FORGOT_TOKEN_INVALID' }
            );
          }

          return context;
        }
      )
    ],
    create: [async context => {
      const { email } = context.data;

      // Find the user by the email
      const result = await context.app.service('users').find({
        query: {
          email,
          status: 1,
          $limit: 1,
          $select: ['_id', 'email', 'token_expires']
        }
      });

      if (result.data.length > 0) {
        let user = result.data[0];

        if (user.token_expires) {
          let iExpire = user.token_expires.getTime(),
            iCurrent = Date.now(),
            // Get the different in minutes
            iDiff = parseInt(((iExpire - iCurrent) / 1000 / 60), 10);

          if (iDiff > 0) {
            throw new errors.BadRequest(
              i18n.single('forgot_already_sent'),
              { label: 'API_FORGOT_ALREADY_SENT' }
            );
          }
        }

        let sToken = await Utils.generateToken({ stringBase: 'hex' }),
          sLink = await Utils.getTargetUrl(context, 'forgot', sToken),
          oData = {
            token_password: sToken,
            token_expires: Date.now() + 3600000
          };

        await context.app.service('mail').create({
          content: await i18n.labelRender(context, { slug: 'forgotemailcontentlbl', section: 'email' }, { link: sLink }),
          title: await i18n.labelRender(context, { slug: 'forgotemailtitlelbl', section: 'email' }),
          email: user.email,
          reference_id: user._id.toString(),
          reference_type: 'forgot',
        });

        await context.app.service('users').patch(user._id, oData);
      } else {
        throw new errors.BadRequest(
          i18n.single('forgot_not_registered'),
          { label: 'API_FORGOT_NOT_REGISTERED' }
        );
      }

      context.result = {
        result: true
      };

      return context;
    }],
    update: [],
    patch: [async context => {
      const { id, data } = context;

      // Search for the user and check that the token has not expired
      const result = await context.app.service('users').find({
        query: {
          status: 1,
          token_password: id,
          token_expires: {
            $gt: Date.now()
          }
        }
      });

      if (result.data.length) {
        const user = result.data[0];

        await context.app.service('users').patch(user._id, {
          ...data,
          token_password: ''
        });
      } else {
        throw new errors.BadRequest(
          i18n.single('forgot_token_invalid'),
          { label: 'API_FORGOT_TOKEN_INVALID' }
        );
      }

      context.result = {
        result: true,
      };

      return context;
    }],
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
