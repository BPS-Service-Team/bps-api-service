const { authenticate } = require('@feathersjs/authentication').hooks;
const validate = require('@feathers-plus/validate-joi');
const { disallow } = require('feathers-hooks-common');
const axios = require('axios');

const { getCustomOptions } = require('../agfs/custom.functions');
const Schema = require('../../schemas/agvs.schema');
const SchemaTask = require('../../schemas/agv-tasks.schema');
const joiOptions = require('../../utils/joi.options').options();
const logger = require('../../logger');

const IS_DEBUG = process.env.CONFIG_DEBUG_MOCK || false;

const fnSendRequest = async context => {
  let aEndpoints = await context.app.service('configs').find({
      query: {
        slug: 'agv-api',
      },
    }),
    oEndpoint = aEndpoints.data[0];

  if (oEndpoint) {
    let oConfig = {},
      sUrl = '',
      oBody = context.data.payload.body;

    for (let oItem of oEndpoint.elements) {
      if (oItem.type === 'json') {
        oConfig[oItem.slug.replace(/-/g, '_')] = JSON.parse(oItem.value);
      } else {
        oConfig[oItem.slug.replace(/-/g, '_')] = oItem.value;
      }
    }
    context.data.endpoint = oConfig;

    sUrl = `${oConfig.url}/geekplus/api/artemis/pushJson/receiptNoteImport?`;
    if (oBody) {
      if (oBody.order_amount !== undefined) {
        sUrl = `${oConfig.url}/geekplus/api/artemis/pushJson/outOrderImport?`;
      }
    }
    sUrl += oConfig.query;
    
    const axiosReq = !IS_DEBUG ? {
      method: 'POST',
      url: sUrl,
      timeout: 5400000,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      data: context.data.payload,
    } : {
      method: 'GET',
      url: 'https://mocki.io/v1/325aeff4-b8e6-4fa7-86d9-2bf9af1d420a',
    };

    return axios(axiosReq)
      .then(response => {
        context.data.result = response.data;
        context.data.status = 'success';
        const { body } = response.data;
        if (!body.success) {
          context.data.status = 'fail';
        }

        return context;
      })
      .catch(error => {
        logger.error('[fnSendRequest] Error: %s', error.message || (typeof error === 'string' ? error : JSON.stringify(error)));
        context.data.result = error.message || error;
        context.data.status = 'error';

        return context;
      });
  }
};

const fnCreateLog = async context => {
  const { data } = context;

  let oLog = {
    type: data.order_type,
    from: {
      text: 'WES',
      domain: context.params.ip,
    },
    to: {
      text: 'AGV',
      domain: data.endpoint.url,
    },
    order_id: data.order_id,
    command: 'agvs/create',
    request: data.payload,
    reply: data.result,
    created_by: data.created_by,
    status: data.status === 'success' ? 1 : 0,
  };

  await context.app.service('wms-logs').create(oLog);

  context.data = {
    receipt_code: data.receipt_code,
    order_id: data.order_id,
    request: data.request,
    direction: data.direction,
    type: data.type,
    status: data.status === 'success' ? 1 : 0,
    created_by: data.created_by,
  };

  if (data.status !== 'success') {
    context.data.retry_count = 1;
  }

  return context;
};

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [],
    create: [
      validate.form(Schema.POST_SCHEMA, getCustomOptions()),
      fnSendRequest,
      fnCreateLog,
      validate.form(SchemaTask.POST_SCHEMA),
    ],
    update: [disallow()],
    patch: [validate.form(SchemaTask.PATCH_SCHEMA, joiOptions)],
    remove: [],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
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
