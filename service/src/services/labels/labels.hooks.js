const { authenticate } = require('@feathersjs/authentication').hooks;
const validate = require('@feathers-plus/validate-joi');

const joiOptions = require('../../utils/joi.options').options();
const Schema = require('../../schemas/labels.schema');

const CONFIG_LANG = process.env.CONFIG_LANG || 'en';

module.exports = {
  before: {
    all: [],
    find: [async context => {
      const { query } = context.params;

      // If the "short" parameter is present, then we send the short version of the data
      if (query.$short !== undefined) {
        let aToFind = ['*'];
        context.params.prefind = {
          $lng: query.$lng || CONFIG_LANG,
          $short: query.$short,
        };

        if (query.$lng) {
          aToFind.push(query.$lng);
        } else {
          aToFind.push(CONFIG_LANG);
        }

        // Add the country to query, and the language added the user language and the '*'
        context.params.query.country = '*';
        context.params.query.language = {
          $in: aToFind
        };

        delete query.$short;
        delete query.$lng;
      }
    }],
    get: [],
    create: [authenticate('jwt'), validate.form(Schema.POST_SCHEMA, joiOptions)],
    update: [authenticate('jwt'), validate.form(Schema.POST_SCHEMA, joiOptions)],
    patch: [authenticate('jwt'), validate.form(Schema.PATCH_SCHEMA, joiOptions)],
    remove: [authenticate('jwt')]
  },

  after: {
    all: [],
    find: [async context => {
      const { result, params } = context;

      // If the "short" parameter exist, then, send a JSON of the labels
      if (params.prefind) {
        if (params.prefind.$short === 'true') {
          let oGeneral = {};

          result.map(row => {
            if (row.language === '*') {
              if (!oGeneral[row.slug]) {
                oGeneral[row.slug] = row.text;
              }
            } else {
              oGeneral[row.slug] = row.text;
            }
          });

          context.result = oGeneral;
        }
      }
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
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
