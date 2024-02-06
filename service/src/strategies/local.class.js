const { LocalStrategy } = require('@feathersjs/authentication-local');
const errors = require('@feathersjs/errors');

const i18n = require('../utils/i18n');
const logger = require('../logger');
const Utils = require('../utils');

exports.CustomLocalStrategy = class CustomLocalStrategy extends LocalStrategy {
  async authenticate(data, params) {
    const { usernameField } = this.configuration;

    try {
      const payload = await super.authenticate(data, params);

      if (payload.user.status === 0) {
        throw new errors.Forbidden(
          i18n.single('auth_not_verified'),
          { label: 'API_USER_UNVERIFIED' }
        );
      } else if (payload.user.status === 2) {
        throw new errors.Forbidden(
          i18n.single('auth_inactive'),
          { label: 'API_USER_INACTIVE' }
        );
      }

      if (payload.user.pass_expires !== undefined) {
        let iExpire = payload.user.pass_expires.getTime(),
          iCurrent = Date.now();

        // If password expire, then create token password
        if (iCurrent > iExpire) {
          let sToken = await Utils.generateToken({ stringBase: 'hex' }),
            oData = {
              token_password: sToken,
              token_expires: Date.now() + 3600000
            };

          await this.app.service('users').patch(payload.user._id, oData);
          throw new errors.Forbidden(
            i18n.single('pass_expired'),
            { label: 'API_PASS_EXPIRED', ...oData }
          );
        }
      }

      const rol = await this.app.service('roles').get(payload.user.rol_id);
      if (rol) {
        payload.user.rol = rol.group;
        payload.user.rol_name = rol.name;
      }

      if (payload.user.pass_attempts !== undefined) {
        if (payload.user.pass_attempts > 1) {
          // Reset the attempts
          await this.app.service('users').patch(payload.user._id, { pass_attempts: 0 });
        }
      }

      return payload;
    } catch (err) {
      if (err.code === 401) {
        if (data[usernameField] !== undefined) {
          try {
            // Find user and update the attempts
            const MAX_ATTEMPTS = parseInt(process.env.CONFIG_PASS_ATTEMPTS || '3', 10),
              user = await this.app.service('users').Model.find({
                [usernameField]: data[usernameField],
                status: 1,
                $or: [
                  {
                    pass_attempts: {
                      $exists: true,
                      $lt: MAX_ATTEMPTS,
                    }
                  },
                  {
                    pass_attempts: {
                      $exists: false,
                    }
                  }
                ]
              }).lean();

            if (user.length) {
              let iAttempts = user[0].pass_attempts === undefined ? 1 : (user[0].pass_attempts + 1),
                newData = {
                  pass_attempts: iAttempts,
                };

              if (iAttempts >= MAX_ATTEMPTS) {
                newData.status = 2;
              }
              await this.app.service('users').patch(user[0], newData);
            } else {
              throw new errors.Forbidden(
                i18n.single('pass_max_attempts'),
                { label: 'API_MAX_ATTEMPTS' }
              );
            }
          } catch (err2) {
            if (err2.code === 403) {
              throw new errors.Forbidden(err2.message || err2);
            } else {
              logger.error('[CustomLocalStrategy] Error: %s', err2.message || (typeof err2 === 'string' ? err2 : JSON.stringify(err2)));
            }
          }
        }
      }

      throw new errors.NotAuthenticated(err.message || err, err.data);
    }
  }
};
