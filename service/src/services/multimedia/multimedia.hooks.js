const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');
const validate = require('@feathers-plus/validate-joi');
const errors = require('@feathersjs/errors');
const fs = require('fs');

const logger = require('../../logger');
const joiOptions = require('../../utils/joi.options').options();
const Schema = require('../../schemas/multimedia.schema');
const i18n = require('../../utils/i18n');
const Utils = require('../../utils');

const fnRemoveLocalFiles = async (context) => {
  const { data } = context;

  if (data.length) {
    try {
      for (let file of data) {
        if (fs.existsSync(file.real_file_path)) {
          fs.unlinkSync(file.real_file_path);
        }
      }
    } catch (err) {
      logger.error(`[${context.method.toUpperCase()} /multimedia] Error: %s`, err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
    }
  }
};

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [async context => {
      const { user, query, _populate } = context.params;

      // Filtramos por los archivos propios del usuario
      if (user && !_populate) {
        if (user.rol !== 'admin') {
          query.user_id = user._id;
        }
      }
    }],
    get: [],
    create: [
      Utils.fnValidateRefIds,
      async context => {
        const { data } = context,
          { user } = context.params,
          user_id = user._id.toString();

        if (!data.files) {
          throw new errors.BadRequest(
            i18n.single('multimedia_empty_files'),
            { label: 'API_MULTIMEDIA_EMPTY_FILES' },
          );
        } else if (data.files.length === 0) {
          throw new errors.BadRequest(
            i18n.single('multimedia_empty_files'),
            { label: 'API_MULTIMEDIA_EMPTY_FILES' },
          );
        }

        let aNewData = [],
          bucket = context.app.get('bucketClient'),
          { custom_path, is_public } = data;

        if (bucket) {
          for (let file of data.files) {
            file.real_file_path = file.file_path;

            if (!is_public) {
              file.file_path = `users/${user_id}/${custom_path ? custom_path : ''}${file.file_name}`;
            } else {
              file.file_path = `public/${custom_path ? custom_path : ''}${file.file_name}`;
            }
            file.user_id = user_id;

            let fileStream = fs.createReadStream(file.real_file_path);
            await bucket.conn.putObject({
              ACL: 'private',
              ContentType: file.file_type,
              Body: fileStream,
              Bucket: bucket.config.name,
              Key: `${bucket.config.prefix}${file.file_path}`,
            }).promise();

            aNewData.push(file);
          }
        } else {
          throw new errors.BadRequest(
            i18n.single('multimedia_not_bucket'),
            { label: 'API_MULTIMEDIA_NOT_BUCKET' },
          );
        }

        context.data = aNewData;
      },
      validate.form(Schema.POST_SCHEMA, joiOptions)
    ],
    update: [disallow()],
    patch: [disallow()],
    remove: [async context => {
      const { user, $element: file } = context.params;

      if (user) {
        if (['admin'].indexOf(user.rol) === -1) {
          if (file.user_id.toString() !== user._id.toString()) {
            throw new errors.BadRequest(
              i18n.single('multimedia_not_deleted'),
              { label: 'API_MULTIMEDIA_NOT_DELETED' },
            );
          }
        }
      }
    }],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [fnRemoveLocalFiles],
    update: [],
    patch: [fnRemoveLocalFiles],
    remove: [async context => {
      const { file_path } = context.result;

      if (file_path) {
        // Remove file from the bucket
        let bucket = context.app.get('bucketClient');

        if (bucket) {
          await bucket.conn.deleteObject({
            Bucket: bucket.config.name,
            Key: `${bucket.config.prefix}${file_path}`
          }).promise();
        }
      }
    }],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [fnRemoveLocalFiles],
    update: [],
    patch: [],
    remove: [],
  },
};
