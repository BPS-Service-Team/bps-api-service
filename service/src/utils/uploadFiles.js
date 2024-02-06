const { iff, isProvider } = require('feathers-hooks-common');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const logger = require('../logger');
const i18n = require('./i18n');

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, './public/uploads/');
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + path.extname(file.originalname));
  }
});

/**
 * This hook function is responsible to remove the local files, that locates
 * into the public folder
 */
const fnRemoveLocalFiles = iff(
  isProvider('rest'),
  async context => {
    const { multimedia } = context.data;

    if (multimedia) {
      if (multimedia.length) {
        try {
          for (let file of multimedia) {
            if (fs.existsSync(file.file_path)) {
              fs.unlinkSync(file.file_path);
            }
          }
        } catch (err) {
          logger.error(`[${context.method.toUpperCase()} /upload] Error: ${err.message}`);
        }
      }
    }
  },
);

/**
 * Aux function to find recursive the string to replace.
 *
 * @param {string} sFind - Name of the key to find
 * @param {string} sReplace - Value to replace into the object
 * @param {object} oFind - Object to find key
 */
const fnRecursiveSet = (sFind, sReplace, oFind) => {
  for (let sKey in oFind) {
    if (Array.isArray(oFind[sKey]) || (Object.keys(oFind[sKey]).length > 0)) {
      if (!oFind[sKey]._bsontype) {
        if (typeof oFind[sKey] === 'object') {
          fnRecursiveSet(sFind, sReplace, oFind[sKey]);
        } else if (oFind[sKey] === sFind) {
          oFind[sKey] = sReplace;
        }
      }
    } else if (oFind[sKey] === sFind) {
      oFind[sKey] = sReplace;
    }
  }
};

/**
 * This function is responsible to save the files into the bucket and
 * replace real path into the result object
 *
 * @param {object} oData - Data to patch
 * @param {object} context - Global context request
 * @param {string} sCustomPath - Custom path
 * @returns {object}
 */
const fnSaveFiles = async (context, sCustomPath = '') => {
  const { result } = context,
    { multimedia } = context.data,
    { user } = context.params;

  if (multimedia) {
    if (multimedia.length > 0) {
      // Upload files
      let bucket = context.app.get('bucketClient'),
        sBasePath = !sCustomPath ? 'public/' : sCustomPath;

      if (bucket) {
        for (let file of multimedia) {
          let sOriginal = file.name,
            sLocalPath = file.file_path,
            sTarget = sBasePath + file.file_name;

          fnRecursiveSet(sOriginal, sTarget, result);
          let fileStream = fs.createReadStream(sLocalPath);

          await bucket.conn.putObject({
            ACL: 'private',
            ContentType: file.file_type,
            Body: fileStream,
            Bucket: bucket.config.name,
            Key: `${bucket.config.prefix}${sTarget}`
          }).promise();

          // Register the file into the
          await context.app.service('multimedia').Model.create({
            user_id: user._id,
            name: sOriginal,
            file_name: file.file_name,
            file_path: sTarget,
            file_type: file.file_type,
            created_at: new Date(),
            updated_at: new Date()
          });

          try {
            if (sLocalPath) {
              if (fs.existsSync(sLocalPath)) {
                fs.unlinkSync(sLocalPath);
              }
            }
          } catch (err) {
            logger.error(`[${context.method.toUpperCase()}/upload] Error: ${err.message}`);
          }
        }

        return true;
      }
    }
  }

  return false;
};

/**
 * Generic function to patch the file path of any of the files uploaded
 */
const fnPatchFiles = iff(
  isProvider('rest'),
  async context => {
    let { result, service } = context,
      { user } = context.params,
      { options } = service,
      sPath = false;

    if (options) {
      if (options.custom_file_path !== undefined) {
        if (options.custom_file_path.indexOf('public') > -1) {
          sPath = options.custom_file_path;
        } else {
          sPath = `${options.custom_file_path}${user._id.toString()}/`;
        }
      }
    }

    let blnNeedUpdate = await fnSaveFiles(context, sPath);
    if (blnNeedUpdate && result) {
      await context.app.service(context.path).Model.findOneAndUpdate({ _id: result._id }, result);
    }
  },
);

module.exports = {
  /**
   * Initialize the script to catch the upload files with multer
   *
   * @param {array} aExtensions - Allow extensions lists
   * @returns {object}
   */
  init: aExtensions => {
    const accepted_extensions = aExtensions ? aExtensions : [
      'jpg', 'jpeg', 'png', 'gif', 'tiff', 'mp3', 'mp4', 'wma', 'wav', 'mpg', 'mpeg', 'webm',
      'txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pdf'
    ];

    return {
      upload: multer({
        storage,
        limits: {
          fileSize: 30 * 1024 * 1024, // Max field value size `MB`,
          files: 10
        },
        fileFilter: (req, file, cb) => {
          // if the file extension is in our accepted list
          if (accepted_extensions.some(ext => file.originalname.toLowerCase().endsWith('.' + ext))) {
            return cb(null, true);
          }

          // otherwise, return error
          return cb(
            new Error(
              i18n.render('multimedia_not_allowed', {
                accepted: accepted_extensions.join(', ')
              })
            )
          );
        }
      }),
    };
  },

  /**
   * This hook function is responsible to upload any files into the body request
   *
   * @param {object} req - Request object
   * @param {object} _res - Response object
   * @param {function} next
   */
  hookFiles: async (req, _res, next) => {
    const { method } = req,
      multimedia = [];

    let blnEnterParse = false;
    if (method === 'POST' || method === 'PATCH') {
      if (req.files) {
        for (let file of req.files) {
          multimedia.push({
            name: file.originalname,
            file_name: file.filename,
            file_path: file.path,
            file_type: file.mimetype
          });

          if (!blnEnterParse) {
            blnEnterParse = true;
          }
        }

        if (blnEnterParse) {
          req.body.multimedia = multimedia;
        }
      }
    }

    next();
  },

  fnRemoveLocalFiles,
  fnPatchFiles,
  fnSaveFiles,
};
