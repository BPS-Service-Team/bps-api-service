const { iff, isProvider } = require('feathers-hooks-common');
const configuration = require('@feathersjs/configuration');
const feathers = require('@feathersjs/feathers');
const crypto = require('crypto');
const errors = require('@feathersjs/errors');
const i18n = require('./i18n');
const logger = require('../logger');

/**
 * This function return the first element on the data
 * @param {object} context - The global context of the service
 * @param {string} service - Service name
 * @param {object} query - Query object
 */
const findOne = async (context, service, data) => {
  const result = await context.app.service(service).find({
    ...context.params,
    ...data,
    provider: undefined,
    query: {
      ...data.query,
      $limit: 1,
    }
  });

  if (result.total > 0) {
    return result.data[0];
  }

  return undefined;
};

/**
 * Obtiene la IP del cliente
 * @param {object} req - Petición
 */
const getClientIP = (req) => {
  const aForwarded = req.headers['x-forwarded-for'],
    sIP = aForwarded ? aForwarded.split(/, /)[0] : req.connection.remoteAddress;

  return sIP;
};

/**
 * Obtiene la lista de las llaves de un esquema
 * @param {object} oJoi - JOI Object
 */
const getKeysRecursive = (oJoi) => {
  let aKeys = [],
    oChildren = oJoi && oJoi._inner && oJoi._inner.children;

  if (Array.isArray(oChildren)) {
    oChildren.map(oRow => {
      aKeys.push(oRow.key);

      getKeysRecursive(oRow.schema).map(
        sKey => aKeys.push(sKey)
      );
    });
  }

  return aKeys;
};

/**
 * Genera un código numérico aleatorio del tamaño que recibe
 * @param {int} iLength - Tamaño del código
 */
const getRandomDigits = (iLength) => {
  let sResult = '',
    sChars = '0123456789',
    iCharLength = sChars.length,
    i = 0;

  for (i = 0; i < iLength; i++) {
    sResult += sChars.charAt(Math.floor(Math.random() * iCharLength));
  }

  return sResult;
};

/**
 * Genera un código numérico aleatorio del tamaño que recibe
 * @param {int} iLength - Tamaño del código
 */
const getRandomCode = (iLength, blnUppercase = false) => {
  let sResult = '',
    sChars = '0123456789abcdefghijklmnopqrstuvwxyz',
    iCharLength = sChars.length,
    i = 0;

  for (i = 0; i < iLength; i++) {
    sResult += sChars.charAt(Math.floor(Math.random() * iCharLength));
  }

  return blnUppercase ? sResult.toUpperCase() : sResult;
};

/**
 * Genera un token en base64
 * @param {*} param0
 */
const generateToken = ({ stringBase = 'base64', byteLength = 48 } = {}) => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(byteLength, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer.toString(stringBase));
      }
    });
  });
};

/**
 * Obtiene un valor en especifico de las variables configuradas en vars
 * @param {string} sName - Nombre de la variable configurada
 */
const getConfigVars = sName => {
  let conf = configuration(),
    app = feathers().configure(conf),
    oVars = app.get('vars'),
    oValue;

  if (oVars) {
    oValue = oVars[sName];
  }

  return oValue;
};

/**
 * Esta función se encarga de hacer un rollback manual, para cuando
 * se creen documentos anidados
 * @param {object} context - Contexto global
 */
const fnRollback = async context => {
  // Si ocurre cualquier error en los servicios anidados deshacemos el cambio
  try {
    if (context.error.hook) {
      if (context.error.hook.result !== undefined) {
        const { method, path } = context.error.hook,
          { _id } = context.error.hook.result;

        if (_id !== undefined && method === 'create') {
          await context.app.service(path).remove(_id);
        }
      }
    }
  } catch (err) {
    logger.error('[fnRollback] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
  }

  return context;
};

/**
 * Está función recursiva permite indagar en la información que se va a insertar, para asegurarnos
 * que los id's que se van a insertar de verdad existan
 * @param {object} schema - Configuración del modelo
 * @param {object} data - Información que se va a insertar
 * @param {object} mongooseClient - Objeto que representa la conexión a la base
 */
const fnIndividualCheck = async (schema, data, mongooseClient) => {
  if (schema) {
    for (let sKey in data) {
      let config = schema[sKey];

      if (config) {
        if (Array.isArray(data[sKey])) {
          for (let oRow of data[sKey]) {
            if (oRow instanceof Object) {
              await fnIndividualCheck(config[0]?.type?.obj, oRow, mongooseClient);
            } else if (typeof oRow === 'string') {
              if (/^[0-9a-fA-F]{24}$/.test(oRow)) {
                let count = await mongooseClient.models[config[0].ref]?.countDocuments({
                  _id: mongooseClient.Types.ObjectId(oRow)
                });

                if (!count) {
                  throw new errors.BadRequest(
                    i18n.render('record_not_found', {
                      id: oRow,
                      ref_single: config[0]?.ref_single?.toLowerCase() || config[0]?.ref
                    })
                  );
                }
              }
            }
          }
        } else if (sKey.indexOf('_id') > -1) {
          if (config.ref) {
            let count = await mongooseClient.models[config.ref]?.countDocuments({
              _id: mongooseClient.Types.ObjectId(data[sKey])
            });

            if (!count) {
              throw new errors.BadRequest(
                i18n.render('record_not_found', {
                  id: data[sKey],
                  ref_single: config.ref_single?.toLowerCase() || config.ref
                })
              );
            }
          }
        }
      }
    }
  }
};

/**
 * Está función se encarga de validar si los id's que se están proporcionando existen
 * @param {object} context - Contexto global
 */
const fnValidateRefIds = async context => {
  const { data, path } = context,
    mongooseClient = context.app.get('mongooseClient'),
    model = mongooseClient.models[path];

  if (model) {
    let { obj } = model.schema;

    if (obj) {
      await fnIndividualCheck(obj, data, mongooseClient);
    }
  }
};

/**
 * Está función se encarga de revisar las vinculaciones antes de hacer alguna operación
 * @param {object} context - Contexto global
 * @param {array} related - Arreglo para validar
 */
const fnValidateRelated = async (context, related) => {
  for (let row of related) {
    let exist = await context.app.service(row.service).find(row.query);

    if (exist.total) {
      if (row.message) {
        throw new errors.BadRequest(row.message);
      } else {
        throw new errors.BadRequest(
          i18n.render('already_related', row)
        );
      }
    }
  }
};

/**
 * Se encarga de mandar el resultado de la búsqueda como si estuviera paginado, esto,
 * para cuando se desactiva desde la configuración del servicio
 * @param {object} context - Contexto global
 */
const fnFakePaginates = async context => {
  const { options } = context.service;

  if (options) {
    if (!options.paginate) {
      context.result = {
        total: context.result.length,
        limit: context.result.length,
        skip: 0,
        data: JSON.parse(JSON.stringify(context.result))
      };
    }
  }

  return context;
};

/**
 * This function is responsible to stick the user ID to the methods
 * create, find and get
 */
const fnStickyUser = iff(
  isProvider('rest'),
  async context => {
    const { user, _populate, $element, custom_rol, validate_rol } = context.params,
      { method } = context;

    let blnContinue = false;
    if (user && !_populate) {
      if (user.rol !== 'admin') {
        if (custom_rol) {
          if (custom_rol.indexOf(user.rol) === -1) {
            blnContinue = true;
          }
        } else {
          blnContinue = true;
        }
      } else if (method === 'create' && !context?.data?.user_id) {
        blnContinue = true;
      }

      if (blnContinue) {
        if (method === 'find' || method === 'get') {
          context.params.query.user_id = user._id.toString();
        } else if (method === 'create') {
          if (validate_rol) {
            if (validate_rol.roles.indexOf(user.rol) === -1) {
              throw new errors.BadRequest(
                validate_rol.message,
              );
            }
          }

          if (!context.data.user_id) {
            context.data.user_id = user._id.toString();
          }
        } else if (method === 'patch' || method === 'remove') {
          // Compare the record user_id with the current logged user
          if ($element.user_id.toString() !== user._id.toString()) {
            throw new errors.BadRequest(
              'You are not allowed to make changes to this record.',
              { label: 'API_UTILS_' }
            );
          }
        }
      } else if (validate_rol && ['create', 'patch'].indexOf(method) > -1) {
        if (context.data.user_id !== undefined) {
          const target = await findOne(context, 'users', {
            query: {
              _id: context.data.user_id,
              status: 1,
              $select: ['_id', 'rol_id'],
            }
          });

          if (!target) {
            throw new errors.BadRequest(
              'The user you are trying to assign does not exist or is inactive.',
              { label: 'API_UTILS_USER_NOT_EXIST' }
            );
          }

          const rol = await findOne(context, 'roles', {
            query: {
              _id: target.rol_id.toString(),
              $select: ['_id', 'group'],
            }
          });

          if (validate_rol.roles.indexOf(rol.group) === -1) {
            throw new errors.BadRequest(
              'The user you are trying to assign is not the type required for this instance.',
              { label: 'API_UTILS_USER_NOT_ROL' }
            );
          }
        }
      }
    }
  },
);

/**
 * This function it's responsible to search the labels and assign the corresponding
 * @param {object} oData - Data to analyze
 * @param {object} oLabels - Labels configuration
 */
const fnParseObjectLlb = (oData, oLabels) => {
  for (let sKey in oData) {
    let sValue = oData[sKey];

    if (typeof sValue === 'string') {
      if (sValue.endsWith('lbl') || sValue === 'label') {
        oData[`${sKey}_text`] = oLabels[sValue] || sValue;
      }
    } else if (typeof sValue === 'object') {
      if (sValue.length) {
        sValue.map((oValue) => {
          fnParseObjectLlb(oValue, oLabels);
        });
      } else {
        fnParseObjectLlb(sValue, oLabels);
      }
    }
  }
};

/**
 * Remove the additional field that corresponding to the translate label
 * @param {object} oData - Data to analyze
 */
const removeParseObjectLbl = (oData) => {
  for (let sKey in oData) {
    let sValue = oData[sKey];

    if (typeof sValue === 'string') {
      if (oData[`${sKey}_text`] !== undefined) {
        delete oData[`${sKey}_text`];
      } else if (sKey.endsWith('_text')) {
        delete oData[`${sKey}`];
      }
    } else if (typeof sValue === 'object') {
      for (let sElement in sValue) {
        if (Array.isArray(sValue[sElement])) {
          sValue[sElement].map((oValue) => {
            for (let sSubKey in oValue) {
              if (sSubKey.endsWith('_text')) {
                delete oValue[`${sSubKey}`];
              }
            }
          });
        } else if (typeof sValue[sElement] === 'object') {
          for (let sSubKey in sValue[sElement]) {
            if (sSubKey.endsWith('_text')) {
              delete sValue[sElement][`${sSubKey}`];
            }
          }
        }
      }
    }
  }
};

/**
 * This function is responsible to parse an error object from joi validation
 *
 * @param {object} data - Object errors from joi validation
 * @returns {object}
 */
const fnParseErrors = data => {
  let result = {};
  for (let single of data.details) {
    result[single.path.join('.')] = single.message;
  }

  return result;
};

/**
 * This function is responsible to generate the URL to verify the user email and the forgot
 *
 * @param {object} context - Global context
 * @param {string} target - Target URL
 * @param {string} token - Token
 * @returns {string}
 */
const getTargetUrl = async (context = {}, target = '', token = '') => {
  let sLink = '',
    oConfig = {};

  const config = await context.app.service('configs').find({
    query: {
      slug: {
        $in: ['deep-config', 'default-pages']
      },
    }
  });

  if (config.total < 1) {
    throw new errors.BadRequest(
      i18n.single('default_page_not_config'),
      { label: 'API_GENERATE_URL_NOT_CONFIG' }
    );
  }

  config.data.map(item => {
    let sKey = item.slug.replace(/-/gi, '_');

    oConfig[sKey] = {};
    item.elements.map(single => {
      let sSub = single.slug.replace(/-/gi, '_');

      oConfig[sKey][sSub] = single.value;
    });
  });

  if (config.total === 2) {
    let aParams = [];

    aParams.push('token=' + encodeURIComponent(token));
    aParams.push('site=' + encodeURIComponent(oConfig.deep_config.website));
    aParams.push('play=' + encodeURIComponent(oConfig.deep_config.play_store));
    aParams.push('apple=' + encodeURIComponent(oConfig.deep_config.app_store));
    aParams.push('schema=' + encodeURIComponent(oConfig.deep_config.app_schema));
    aParams.push('app=' + encodeURIComponent(oConfig.default_pages[`${target}_app`]));
    aParams.push('page=' + encodeURIComponent(oConfig.default_pages[`${target}_page`]));

    sLink = `${oConfig.default_pages.website}/deep.html?${aParams.join('&')}`;
  } else {
    sLink = `${oConfig.default_pages.website}/${oConfig.default_pages[`${target}_page`]}?q=${token}`;
  }

  return sLink;
};

/**
 * This function is responsible to parse the context manually on custom services
 *
 * @param {Object} req - Request object express
 * @param {Object} _res - Response object express
 * @param {function} next - Next function
 */
const parseContext = async (req, _res, next) => {
  const methods = {
    GET: 'find',
    POST: 'create',
    PATCH: 'patch',
    PUT: 'update',
    DELETE: 'remove',
  };

  req.feathers.type = 'before';
  req.feathers.path = req.originalUrl;
  req.feathers.method = methods[req.method];
  next();
};

/**
 * This function is responsible to parse the custom errors
 *
 * @param {object} _ - Request object express
 * @param {object} res - Response object express
 * @param {function} next - Next function
 */
const checkErrorContext = async (_, res, next) => {
  const { data } = res;

  if (data) {
    if (data.errno !== undefined) {
      if (data.errno === 1) {
        res.statusCode = data.code || 400;

        if (data.code) {
          delete data.code;
        }
      }
    }
  }

  next();
};

/**
 * @description - Fn to encapsulate external requests
 * @param {object} req - Express Request
 * @param {object} _res - Express Request
 * @param {fn} next - Ref to next fn
 */
const encapsulateBody = async (req, _res, next) => {
  if (!req.headers['skip-encapsulation']) {
    const oPayload = req.body;
    delete req.body;

    req.body = {
      payload: oPayload,
      task_no: oPayload.taskNo,
    };
  }
  next();
};

/**
 * @description - Fn to remove all duplicate elements from array of objects
 * @param {array} arr - Array of objects to remove duplicate elements
 */

function removeDuplicates(arr) {
  const uniqueObjects = arr.reduce((unique, obj) => {
    if (!unique.some((o) => Object.keys(obj).every((key) => obj[key] === o[key]))) {
      unique.push(obj);
    } else {
      console.log('Duplicate element', obj);
    }
    return unique;
  }, []);
  return uniqueObjects;
}


module.exports = {
  checkErrorContext,
  encapsulateBody,
  findOne,
  fnFakePaginates,
  fnParseErrors,
  fnParseObjectLlb,
  fnRollback,
  fnStickyUser,
  fnValidateRefIds,
  fnValidateRelated,
  generateToken,
  getClientIP,
  getConfigVars,
  getKeysRecursive,
  getRandomCode,
  getRandomDigits,
  getTargetUrl,
  parseContext,
  removeParseObjectLbl,
  removeDuplicates,
};
