const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow, isProvider, iff, populate } = require('feathers-hooks-common');
const { hashPassword, protect } = require('@feathersjs/authentication-local').hooks;
const validate = require('@feathers-plus/validate-joi');
const errors = require('@feathersjs/errors');
const bcrypt = require('bcryptjs');
const ms = require('ms');

const joiOptions = require('../../utils/joi.options').options();
const uploadFiles = require('../../utils/uploadFiles');
const Schema = require('../../schemas/users.schema');
const Utils = require('../../utils');
const i18n = require('../../utils/i18n');

const DEFAULT_ROLE = process.env.CONFIG_DEFAULT_ROLE || false;

const validatePassword = async context => {
  let { $element: old } = context.params;
  if (!old && context.id) {
    old = await context.app.service('users').get(context.id);
  }

  const { data } = context,
    { password, rpassword } = data,
    HISTORY_LENGTH = process.env.CONFIG_PASS_HISTORY ? parseInt(process.env.CONFIG_PASS_HISTORY, 10) : 6;

  // Check if trying to edit the password
  if (password) {
    // Validate if the user tries to update within the allowed time
    if (old.pass_changed) {
      let iExpire = old.pass_changed.getTime(),
        iCurrent = Date.now(),
        sTime = process.env.CONFIG_PASS_CHANGED || '24h';

      if (iCurrent < iExpire) {
        throw new errors.BadRequest(
          `It's not allowed to change the password again, until after the period of "${sTime}"`
        );
      }
    }

    if (old.pass_history) {
      let aToCompare = [].concat(old.pass_history);
      aToCompare.push(old.password);

      let aComparePlain = [];
      aComparePlain.push(old.email.substr(0, old.email.indexOf('@')));
      aComparePlain.push(old.full_name);
      aComparePlain = aComparePlain.concat(old.full_name.split(' '));

      for (let sCompare of aComparePlain) {
        if (rpassword.toLowerCase().indexOf(sCompare.toLowerCase()) > -1) {
          throw new errors.BadRequest('You cannot use a weak password, please specify another');
        }
      }

      // Check if the new password already used
      for (let sOldPass of aToCompare) {
        if (bcrypt.compareSync(rpassword, sOldPass)) {
          throw new errors.BadRequest('You cannot use a password that you have used recently, please choose another.');
        }
      }

      if (old.pass_history.length >= HISTORY_LENGTH) {
        old.pass_history.shift();
      }
      old.pass_history.push(password);
      data.pass_history = old.pass_history;
    } else {
      data.pass_history = [password];
    }

    const PASS_CHANGED = ms(process.env.CONFIG_PASS_CHANGED || '24h'),
      PASS_EXPIRE = ms(process.env.CONFIG_PASS_EXPIRE || '180d');

    data.pass_changed = new Date(Date.now() + PASS_CHANGED);
    data.pass_expires = new Date(Date.now() + PASS_EXPIRE);
  }
};

/**
 * This function is in charge of verifying if the passwords match
 * between passwords and repeat password
 *
 * @param {object} context - Global context
 */
const fnCheckPasswords = async context => {
  const { password, rpassword } = context.data;

  if (password !== rpassword) {
    throw new errors.BadRequest(
      i18n.single('register_pass_not_match'),
      { label: 'API_USER_PASS_NOT_MATCH' },
    );
  } else if (password === '') {
    delete context.data.password;
  }

  return context;
};

/**
 * This function is responsible to stick the user id when the user rol is different to admin,
 * also if the user try to find a user by rol name, find the rol first.
 *
 * @param {object} context - Global context
 */
const fnStickyQuery = async context => {
  let { user, query, _populate } = context.params;

  if (!_populate) {
    if (!query) {
      query = {};
    }

    if (user) {
      if (user.rol !== 'admin') {
        query._id = user._id.toString();
      }
    }

    if (query) {
      if (query.rol) {
        let rol;
        //Soporte para filtrar más de un rol
        if (query.rol.$in) {
          rol = await context.app.service('roles').find({
            query: {
              $select: ['_id', 'group'],
              $or: query.rol.$in?.map(role => ({
                group: role
              }))
            },
          });
          if (rol.data) {
            query.rol_id = {
              $in: rol.data.map(role => role._id)
            };
          }
        } else {
          rol = await Utils.findOne(context, 'roles', {
            query: {
              group: query.rol.toString(),
              $limit: 1,
              $select: ['_id', 'group'],
            },
          });

          if (rol) {
            query.rol_id = rol._id.toString();
          }
        }
      }
      delete query.rol;
    }
  }
};

const fnStickyRole = iff(
  isProvider('rest'),
  async context => {
    const { data } = context,
      { user } = context.params;

    if (!data.rol_id || ['open-endpoints'].indexOf(user.rol) > -1) {
      if (!DEFAULT_ROLE) {
        throw new errors.BadRequest(
          'No se encuentra configurado el rol default',
          { label: 'API_DEFAULT_ROLE_USER' },
        );
      }

      const rol = await Utils.findOne(context, 'roles', {
        query: {
          group: user.rol === 'open-endpoints' ? DEFAULT_ROLE : 'external',
          $select: ['_id', 'group']
        }
      });

      if (!rol) {
        throw new errors.BadRequest(
          `No se encontró la información del rol "${DEFAULT_ROLE}" en los registros`,
          { label: 'API_DEFAULT_ROLE_REGISTER' },
        );
      }

      data.rol_id = rol._id.toString();
    }
  },
);

module.exports = {
  before: {
    all: [],
    find: [
      authenticate('jwt'),
      iff(
        isProvider('rest'),
        fnStickyQuery
      )
    ],
    get: [
      authenticate('jwt'),
      iff(
        isProvider('rest'),
        fnStickyQuery
      )
    ],
    create: [
      fnCheckPasswords,
      fnStickyRole,
      validate.form(Schema.POST_SCHEMA, joiOptions),
      Utils.fnValidateRefIds,
      hashPassword('password'),
      iff(
        isProvider('rest'),
        async context => {
          const { user } = context.params;

          if (['open-endpoints'].indexOf(user.rol) > -1) {
            context.data.status = 0;
          }
        }
      ),
    ],
    update: [disallow('rest')],
    patch: [
      fnCheckPasswords,
      validate.form(Schema.PATCH_SCHEMA, joiOptions),
      Utils.fnValidateRefIds,
      iff(
        isProvider('rest'),
        async context => {
          const { user } = context.params,
            { id } = context;

          if (['admin'].indexOf(user.rol) === -1) {
            if (id.toString() !== user._id.toString()) {
              throw new errors.MethodNotAllowed(
                'You are not allowed to edit this user',
                { label: 'API_USER_NOT_ALLOWED_EDIT' }
              );
            }
          }
        },
      ),
      hashPassword('password'),
      validatePassword,
      authenticate('jwt')
    ],
    remove: [disallow('rest')]
  },

  after: {
    all: [
      // Make sure the password field is never sent to the client
      // Always must be the last hook
      protect(
        'password', 'token_expires', 'token_password',
        'token', 'pass_changed', 'pass_history'
      ),
    ],
    find: [],
    get: [],
    create: [uploadFiles.fnPatchFiles],
    update: [],
    patch: [uploadFiles.fnPatchFiles],
    remove: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [uploadFiles.fnRemoveLocalFiles, Utils.fnRollback],
    update: [],
    patch: [uploadFiles.fnRemoveLocalFiles],
    remove: [],
  },
};
