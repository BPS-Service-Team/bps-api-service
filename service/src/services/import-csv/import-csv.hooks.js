const { authenticate } = require('@feathersjs/authentication').hooks;
const errors = require('@feathersjs/errors');
const moment = require('moment');
const csv = require('fast-csv');
const fs = require('fs');

const logger = require('../../logger');

const aValidCollections = ['testings'];
const aExcludeKeys = [
  '_id', 'created_at', 'updated_at', 'result', 'status', 'token_password',
  'token_expires', 'pass_changed', 'pass_expires', 'pass_attempts', 'pass_history',
];

/**
 * Se encarga de borrar los archivos locales después de haberse usado
 * @param {object} context - Contexto global de la petición
 */
const fnRemoveLocalFiles = async (context) => {
  const { data } = context;

  if (data.length) {
    try {
      for (let file of data) {
        if (fs.existsSync(file.file_path)) {
          fs.unlinkSync(file.file_path);
        }
      }
    } catch (err) {
      logger.error(`[${context.method.toUpperCase()} /import-csv] Error: %s`, err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
    }
  }
};

/**
 * Get the schema definition recursive
 * @param {object} oResult - Result to be sent to the client
 * @param {object} oModel - Current model, can be a sub-model
 * @param {string} sPrefix - Prefix of the key
 */
const fnRecursiveSchema = (oResult, oModel, sPrefix, onlyRequired = true) => {
  let oSchema = oModel.obj;

  for (let sKey in oSchema) {
    if (aExcludeKeys.indexOf(sKey) === -1) {
      let oRow = oSchema[sKey],
        sRealKey = `${sPrefix}${sKey}`,
        oConfig = { messages: [], attributes: {} };

      if (typeof oRow.type === 'function') {
        // Extract the attributes
        oConfig.attributes = (
          ({ required, unique, max, min, lowercase, uppercase, cusindex, arraysplit, ref_name, ref_field, allow_values }) => (
            { required, unique, max, min, lowercase, uppercase, cusindex, arraysplit, ref_name, ref_field, allow_values }
          )
        )(oRow);

        if (onlyRequired) {
          if (!oConfig.attributes.required) {
            continue;
          }
        }

        if (!oRow.subtype) {
          continue;
        }

        oResult.fields.push(`${sRealKey}`);
        oConfig.attributes.default = oRow.default;
        oConfig.attributes.type = oRow.subtype;

        if (oRow.subtype === 'string') {
          oConfig.messages.push('Must be a string');
        } else if (oRow.subtype === 'number') {
          oConfig.messages.push('Must be a number');
        } else if (oRow.subtype === 'double') {
          oConfig.messages.push('Must be a floating');
        } else if (oRow.subtype === 'date') {
          oConfig.messages.push('Must be a date with the format "01/31/2019 16:00"');
        } else if (oRow.subtype === 'array') {
          oConfig.messages.push(`Must be a string separated with "${oRow.arraysplit}"`);
        }

        if (oRow.ref_name !== undefined) {
          if (!oRow.ref_field) {
            oConfig.messages.push('Must refer to the "' + oRow.ref_name + '"');
          } else {
            oConfig.messages.push('The field has to refer to the field "' + oRow.ref_field + '" of "' + oRow.ref_name + '"');
          }

          oConfig.attributes.ref = oRow.ref;
          oConfig.attributes.ref_name = oRow.ref_name;
          oConfig.attributes.ref_field = oRow.ref_field;
        }

        // Build the messages
        if (oConfig.attributes.required === true) {
          oConfig.messages.push('Is required');
        }
        if (oConfig.attributes.unique === true) {
          oConfig.messages.push('Must be unique in the DB');
        }
        if (oConfig.attributes.max !== undefined) {
          oConfig.messages.push(`Length must be less than or equal to ${oConfig.attributes.max} characters long`);
        }
        if (oConfig.attributes.min !== undefined) {
          oConfig.messages.push(`Length must be at least ${oConfig.attributes.min} characters long`);
        }
        if (oConfig.attributes.lowercase === true) {
          oConfig.messages.push('Will be converted to lowercase');
        }
        if (oConfig.attributes.uppercase === true) {
          oConfig.messages.push('Will be converted to uppercase');
        }
        if (oConfig.attributes.allow_values !== undefined) {
          oConfig.messages.push('Only the values "' + oConfig.attributes.allow_values.join(', ') + '" are allowed');
        }

        oResult.config[sRealKey] = oConfig;
      } else if (Array.isArray(oRow)) {
        fnRecursiveSchema(oResult, oRow[0], `${sKey}-`);
      } else {
        fnRecursiveSchema(oResult, oRow, `${sKey}-`);
      }
    }
  }
};

/**
 * Get the schema definition according to the model
 * @param {object} context - Global context
 * @param {string} sType - Model name
 */
const fnGetSchemaDefinition = (context, sType, onlyRequired = true) => {
  let oResult = {
      fields: [],
      config: {},
      example: {}
    },
    mongooseClient = context.app.get('mongooseClient'),
    sService = sType.replace(/-/g, '_'),
    oModel = mongooseClient.modelSchemas[sService];

  if (oModel) {
    fnRecursiveSchema(oResult, oModel, '', onlyRequired);
  }

  return oResult;
};

/**
 * Get an example of the current service
 * @param {object} context - Global context
 * @param {object} oResult - Result object to send
 * @param {string} sType - Name of the service
 */
const fnGetExample = async (context, oResult, sType) => {
  let oData = await context.app.service(sType).find({
      query: {
        $limit: 1
      }
    }),
    aExample = [],
    oHeader = {};

  if (oData.total > 0) {
    let oRow = oData.data[0],
      aColumns = oResult.fields || [],
      oConfig = oResult.config,
      blnHaveSubs = false,
      aSubKeys = {};

    aColumns.map(sKey => {
      if (sKey.indexOf('-') === -1) {
        if (oConfig[sKey].attributes.type === 'array') {
          oHeader[sKey] = oRow[sKey].join(oConfig[sKey].attributes.arraysplit || ',');
        } else if (oConfig[sKey].attributes.ref_name !== undefined) {
          oHeader[sKey] = oConfig[sKey].attributes.ref_name;
        } else if (oConfig[sKey].attributes.default !== undefined) {
          oHeader[sKey] = oConfig[sKey].attributes.default;
        } else {
          oHeader[sKey] = oRow[sKey] || '';
        }
      } else {
        if (!blnHaveSubs) {
          blnHaveSubs = true;
        }

        let aSubs = sKey.split('-');
        if (aSubs.length === 2) {
          if (aSubKeys[aSubs[0]] === undefined) {
            aSubKeys[aSubs[0]] = [];
          }

          aSubKeys[aSubs[0]].push(aSubs[1]);
        }
      }
    });

    if (blnHaveSubs) {
      for (let sKey in aSubKeys) {
        let aTemp = oRow[sKey];

        if (Array.isArray(aTemp)) {
          aTemp.map(oTemp => {
            let oAux = JSON.parse(JSON.stringify(oHeader));

            aSubKeys[sKey].map(sSubKey => {
              oAux[`${sKey}-${sSubKey}`] = oTemp[sSubKey];
            });

            aExample.push(oAux);
          });
        } else if (Object.keys(aTemp).length) {
          for (let sSubKey in aTemp) {
            oHeader[`${sKey}-${sSubKey}`] = aTemp[sSubKey];
          }
        }
      }
    }
    aExample.push(oHeader);

    aExample.map(oTemp => {
      for (let sKey in oTemp) {
        if (oTemp[sKey]) {
          if (typeof oTemp[sKey].getDate === 'function') {
            oTemp[sKey] = moment(oTemp[sKey]).format('MM/DD/YYYY HH:mm');
          }
        }
      }
    });
  }

  oResult.example = aExample;
};

const fnAnalyzeData = oData => {
  let oRow = {};

  for (let sKey in oData) {
    let aSplit = sKey.split('-'),
      oRef;

    if (aSplit.length > 1) {
      for (let i = 0; i < aSplit.length; i++) {
        let sSubKey = aSplit[i];

        if (i === (aSplit.length - 1)) {
          oRef[sSubKey] = oData[sKey];
        } else {
          if (!oRow[sSubKey]) {
            oRef = {};
            oRow[sSubKey] = oRef;
          } else {
            oRef = oRow[sSubKey];
          }
        }
      }
    } else {
      oRow[sKey] = oData[sKey];
    }
  }

  return oRow;
};

/**
 * This function is responsible to create or update according to the import data
 * @param {object} oConfig - Object necesary to get data and insert or update
 * @param {object} context - Contexto global
 */
const fnCreateOrUpdateData = async (oConfig, context) => {
  let oReturn = { inserted: 0, updated: 0, failure: 0, errors: [] },
    oForeignKeys = oConfig.foreign,
    oData;

  for (let j = 0; j < oConfig.data.length; j++) {
    try {
      let oRow = oConfig.data[j],
        blnExists = false,
        sId = '';

      oData = fnAnalyzeData(oRow);
      // If a custom index is defined
      if (oConfig.index.have) {
        // First look for if exist the record
        let oQuery = { query: {} },
          oCopy = { $push: {} },
          blnRmvPush = true,
          blnContinue = false,
          options = context.app.service(oConfig.service).options,
          exist;

        for (let sKey of oConfig.index.fields) {
          oQuery.query[sKey] = oData[sKey];
        }
        exist = await context.app.service(oConfig.service).find(oQuery);

        if (!options.paginate) {
          blnContinue = exist.length > 0;
        } else {
          blnContinue = exist.data.length > 0;
        }

        if (blnContinue) {
          blnExists = true;
          sId = !options.paginate ? exist[0]._id : exist.data[0]._id;

          for (let sKey in oData) {
            if (typeof oData[sKey] === 'object' && oData[sKey].length === undefined) {
              if (blnRmvPush) {
                blnRmvPush = false;
              }

              oCopy.$push[sKey] = [];
              oCopy.$push[sKey].push(oData[sKey]);
            } else {
              oCopy[sKey] = oData[sKey];
            }
          }

          if (blnRmvPush) {
            delete oCopy.$push;
          }

          oData = oCopy;
        }
      }

      // If foreign key exists, first looking for the value
      if (Object.keys(oForeignKeys).length) {
        for (let sKey in oForeignKeys) {
          if (oData[sKey] !== undefined) {
            let oQuery = {
                query: {
                  $limit: 1,
                  $select: ['_id', oForeignKeys[sKey].ref_field]
                }
              }, foreign,
              sService = await oForeignKeys[sKey].ref.toString();

            oQuery.query[oForeignKeys[sKey].ref_field] = oData[sKey];
            foreign = await context.app.service(sService).find(oQuery);

            if (foreign.data.length) {
              oData[sKey] = foreign.data[0]._id.toString();
            } else {
              throw new Error(
                `Could not find "${oForeignKeys[sKey].ref_name}" with value "${oData[sKey]}" in reference "${oForeignKeys[sKey].ref}"`
              );
            }
          }
        }
      }

      if (!blnExists) {
        await context.app.service(oConfig.service).create(oData);
        oReturn.inserted++;
      } else {
        await context.app.service(oConfig.service).patch(sId, oData);
        oReturn.updated++;
      }
    } catch (error) {
      oReturn.failure++;
      oReturn.errors.push({
        messages: error.message || error.errors,
        context: oData
      });
    }
  }

  return oReturn;
};

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [],
    create: [async context => {
      let { data } = context,
        sLogId = '',
        oLog = {
          type: '',
          total: 0,
          inserted: 0,
          updated: 0,
          failure: 0,
          log: [],
          status: 0
        };

      context.result = {
        process: true
      };

      // Validate the type model
      if (data.type) {
        if (aValidCollections.indexOf(data.type) > -1) {
          let oResult = fnGetSchemaDefinition(context, data.type, data.required === undefined);

          oResult.service = data.type;
          oResult.real_headers = [];

          if (data?.files?.length) {
            oLog.type = data.type;
            let oFile = data.files[0];
            const fileStream = fs.createReadStream(oFile.file_path),
              parser = csv.parse({ ignoreEmpty: true });

            const registerLog = await context.app.service('import-logs').create(oLog);
            if (registerLog) {
              sLogId = registerLog._id.toString();
              context.result.log_id = sLogId;
            }
            delete oLog.log;

            fileStream
              .pipe(parser)
              .on('error', error => {
                logger.error('[POST /import-csv] Error when try to read the CSV file: %s', error.message || (typeof error === 'string' ? error : JSON.stringify(error)));
                if (fs.existsSync(oFile.file_path)) {
                  fs.unlinkSync(oFile.file_path);
                }
              })
              .on('readable', async () => {
                try {
                  // Obtenemos los campos del reporte
                  let aFields = !oResult.real_headers.length ? oResult.fields : oResult.real_headers,
                    oConfig = oResult.config,
                    sService = oResult.service,
                    oIndex = { have: false, fields: [] },
                    oForeignKeys = {},
                    aData = [];

                  for (let row = parser.read(); row; row = parser.read()) {
                    if (aFields.length > 0) {
                      let oData = {},
                        oFieldConf;

                      for (let i in row) {
                        // As the CSV header is analyzed first we save them in the actual headers
                        if (aFields.find(sKey => sKey === row[i]) !== undefined) {
                          oResult.real_headers.push(row[i]);
                          continue;
                        }

                        // We obtain the field configuration in the corresponding model
                        oFieldConf = oConfig[aFields[i]];
                        let strValue = row[i].replace(/(\r\n|\n|\r)/gm, '').trim();
                        if (strValue.length === 0) {
                          continue;
                        }
                        oData[aFields[i]] = strValue;

                        if (oFieldConf.attributes) {
                          if (oFieldConf.attributes.default !== undefined && !row[i]) {
                            oData[aFields[i]] = oFieldConf.attributes.default;
                          }

                          // If it is a custom index, then we change some variables
                          if (oFieldConf.attributes.cusindex) {
                            oIndex.have = true;
                            if (!oIndex.fields.find(sName => sName === aFields[i])) {
                              oIndex.fields.push(aFields[i]);
                            }
                          } else if (oFieldConf.attributes.ref_field) {
                            oForeignKeys[aFields[i]] = {
                              ref: oFieldConf.attributes.ref,
                              ref_field: oFieldConf.attributes.ref_field,
                              ref_name: oFieldConf.attributes.ref_name,
                            };
                          } else if (oFieldConf.attributes.type === 'array') {
                            oData[aFields[i]] = row[i].split(oFieldConf.attributes.arraysplit || ',');
                          } else if (oFieldConf.attributes.type === 'date') {
                            let oDate = moment(oData[aFields[i]], 'MM/DD/YYYY HH:mm');

                            if (oDate.isValid()) {
                              oData[aFields[i]] = oDate.toDate();
                            }
                          } else if (oFieldConf.attributes.type === 'number') {
                            oData[aFields[i]] = parseFloat(strValue);
                          }
                        }
                      }

                      if (Object.keys(oData).length) {
                        aData.push(oData);
                      }
                    }
                  }

                  if (aData.length) {
                    oLog.total += aData.length;
                    let oReturn = await fnCreateOrUpdateData({
                      data: aData,
                      index: oIndex,
                      service: sService,
                      foreign: oForeignKeys,
                    }, context);

                    oLog.inserted += oReturn.inserted;
                    oLog.updated += oReturn.updated;
                    oLog.failure += oReturn.failure;
                    if (oReturn.errors.length) {
                      oLog.$push = {
                        log: oReturn.errors
                      };
                    }

                    if (oLog.total === (oLog.inserted + oLog.updated + oLog.failure)) {
                      oLog.status = 1;
                    }

                    // We update the import log
                    await context.app.service('import-logs').patch(sLogId, oLog);
                  }
                } catch (error) {
                  await context.app.service('import-logs').patch(sLogId, { $push: { log: { message: error.message || error } } });
                }
              })
              .on('end', rowCount => {
                oLog.total = rowCount - 1;
              });
          } else {
            throw new errors.BadRequest(
              'Please provide the CSV file',
              { label: 'API_IMPORT_PROVIDE_CSV' }
            );
          }
        } else {
          throw new errors.BadRequest(
            'The data type of the import isn\'t a valid',
            { label: 'API_IMPORT_INVALID' }
          );
        }
      } else {
        throw new errors.BadRequest(
          'Please provide the type of the import data',
          { label: 'API_IMPORT_TYPE' }
        );
      }

      return context;
    }],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [async context => {
      const { query } = context.params;

      // Validate the type model
      if (query.type) {
        if (aValidCollections.indexOf(query.type) > -1) {
          let oResult = fnGetSchemaDefinition(context, query.type, query.required === undefined);
          await fnGetExample(context, oResult, query.type);

          context.result = oResult;
        }
      }

      return context;
    }],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [fnRemoveLocalFiles],
    update: [],
    patch: [],
    remove: []
  }
};
