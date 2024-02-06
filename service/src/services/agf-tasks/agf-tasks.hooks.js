const { authenticate } = require('@feathersjs/authentication').hooks;
const validate = require('@feathers-plus/validate-joi');
const { disallow } = require('feathers-hooks-common');
const axios = require('axios');

const { getCustomOptions } = require('../agfs/custom.functions');
const { checkPendingTasks } = require('../../utils/putaways');
const Schema = require('../../schemas/agfs.schema');
const SchemaTask = require('../../schemas/agf-tasks.schema');
const joiOptions = require('../../utils/joi.options').options();
const logger = require('../../logger');

const IS_DEBUG = process.env.CONFIG_DEBUG_MOCK || false;

const fnSendRequest = async (context) => {
  if (context.data.type === 'create') {
    // We check if there a task in start
    const tasks = await context.app.service('agf-tasks').find({
      query: {
        status: 2,
      }
    });

    if (!tasks.total) {
      let aEndpoints = await context.app.service('configs').find({
          query: {
            slug: 'agf-api'
          }
        }),
        oEndpoint = aEndpoints.data[0],
        oConfig = {};

      for (let oItem of oEndpoint.elements) {
        oConfig[oItem.slug.replace(/-/g, '_')] = oItem.value;
      }

      context.data.endpoint = oConfig;
      const axiosReq = !IS_DEBUG ? {
        method: 'POST',
        url: `${oConfig.url}/api/createTask`,
        timeout: 10000,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        data: context.data.payload,
      } : {
        method: 'GET',
        url: 'https://mocki.io/v1/4060cf69-922d-44bd-908c-d8647ceca89b',
      };

      return axios(axiosReq)
        .then((response) => {
          const { data } = response;

          context.data.result = data;
          context.data.status = !data.success ? 'error' : 'success';

          return context;
        })
        .catch((error) => {
          logger.error('[fnSendRequest] Error: %s', error.message || (typeof error === 'string' ? error : JSON.stringify(error)));
          context.data.result = error.message || error;
          context.data.status = 'error';

          return context;
        });
    } else {
      context.params.not_send = true;
      context.data.status = 'success';
    }
  }
};

const fnCreateLog = async (context) => {
  const { data, params } = context,
    { not_send } = context.params,
    { payload } = data;

  let oData = {
    order_id: data.order_id,
    task_no: data.task_no,
    request: data.request,
    direction: data.direction,
    task_type: payload.taskType,
    location_source: payload.locationSource,
    location_destination: payload.locationDestination,
    priority: payload.priority,
    pallet_type: payload.palletType,
    check: data.check,
    cancel_on_finish: data.cancel_on_finish || false,
    created_by: data.created_by || params?.user?._id.toString(),
    status: 1,
  };

  if (!not_send) {
    let aOrder = await context.app.service('orders').find({
        query: {
          order_id: data.order_id,
          $select: ['order_id', 'type'],
          $limit: 1,
        }
      }),
      order = aOrder.total ? aOrder.data[0] : null;

    if (context?.params?.headers?.['cycle-count-log']) {
      await context.app.service('wms-logs').create({
        type: order ? data.force_type || order.type : undefined,
        from: {
          text: 'WES',
          domain: params.ip,
        },
        to: {
          text: 'AGF',
          domain: data.endpoint.url,
        },
        order_id: data.order_id,
        command: 'orders/cycle-count',
        request: data.payload,
        reply: data.result,
        created_by: data.created_by,
        status: data.status === 'success' ? 1 : 0,
      });
    }

    await context.app.service('wms-logs').create(
      {
        type: order ? (data.force_type || order.type) : undefined,
        from: {
          text: 'WES',
          domain: params.ip,
        },
        to: {
          text: 'AGF',
          domain: data.endpoint.url,
        },
        order_id: data.order_id,
        command: 'agfs/create',
        request: data.payload,
        reply: data.result,
        created_by: data.created_by,
        status: data.status === 'success' ? 1 : 0,
      }
    );

    oData.status = data.status === 'success' ? 2 : 1;
    if (data.status === 'error') {
      oData.check_error = true;
      oData.retry_count = 1;
      oData.error = typeof data.result === 'string' ? [{
        message: data.result,
        date: new Date(),
      }] : [{
        ...data.result,
        date: new Date(),
      }];
    }
  }

  context.data = oData;
  return context;
};

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [],
    create: [
      fnSendRequest,
      validate.form(Schema.POST_SCHEMA, getCustomOptions()),
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
    create: [
      async context => {
        const { result } = context;

        if (result.check_error) {
          // Try to send the task again
          checkPendingTasks(context.app, context.params);
        }
      },
    ],
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
