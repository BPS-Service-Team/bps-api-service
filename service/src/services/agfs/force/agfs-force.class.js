const axios = require('axios');
const errors = require('@feathersjs/errors');
const logger = require('../../../logger');

const IS_DEBUG = process.env.CONFIG_DEBUG_MOCK || false;

exports.AgfsForce = class AgfsForce {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    const app = this.app,
      { task_no } = data,
      { user } = params,
      user_id = user?._id.toString() || undefined;

    // Find the task to update the corresponding AGF
    let aTask = await app.service('agf-tasks').find({
        query: {
          task_no,
          $limit: 1,
        }
      }),
      oTask = aTask.data[0];

    if (!oTask) {
      throw new errors.NotFound('Task not found');
    } else if (oTask.status === 5) {
      throw new errors.BadGateway('Task is already canceled');
    }

    // We check if there a task in start
    const tasks = await app.service('agf-tasks').find({
      query: {
        status: 2,
      }
    });

    if (!tasks.total) {
      const aOrder = await app.service('orders').find({
          query: {
            order_id: oTask.order_id,
            $limit: 1,
          },
        }),
        order = aOrder.data[0];

      if (!order) {
        throw new errors.NotFound(`Order with the ID ${order.order_id} not found`);
      }

      // If task is on error, change status to 1
      if (oTask.status === 6) {
        await app.service('agf-tasks').patch(oTask._id, {
          updated_by: user_id,
          status: 1,
        });
      }

      let aEndpoints = await app.service('configs').find({
          query: {
            slug: {
              $in: ['agf-api', 'general'],
            }
          }
        }),
        oConfig = {},
        oPayload = {
          lpn: oTask.location_destination,
          taskNo: task_no,
          taskType: 'Inbound',
          locationSource: oTask.location_source,
          locationDestination: oTask.location_destination,
          palletType: oTask.pallet_type,
        };

      for (let oSingle of aEndpoints.data) {
        for (let oItem of oSingle.elements) {
          oConfig[oItem.slug.replace(/-/g, '_')] = oItem.value;
        }
      }

      oPayload.checkWidth = order.type === 'picking' ? 'N' : (oConfig.check_width || 'N');
      oPayload.checkHeight = order.type === 'picking' ? 'N' : (oConfig.check_height || 'N');

      let oLog = {
        type: order.type,
        from: {
          text: 'WES',
          domain: params.ip,
        },
        to: {
          text: 'AGF',
          domain: oConfig.url,
        },
        order_id: order.order_id,
        command: 'agfs/create',
        request: oPayload,
        reply: {},
        created_by: user._id.toString(),
        status: 0,
      };

      const axiosReq = !IS_DEBUG ? {
        method: 'POST',
        url: `${oConfig.url}/api/createTask`,
        timeout: 10000,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        data: oPayload,
      } : {
        method: 'GET',
        url: 'https://mocki.io/v1/4060cf69-922d-44bd-908c-d8647ceca89b',
      };

      return axios(axiosReq)
        .then(async (response) => {
          oLog.reply = response.data;
          oLog.status = !oLog.reply ? 0 : 1;

          if (oLog.status) {
            // Update task status to 2 - In process
            oTask = await app.service('agf-tasks').patch(oTask._id, {
              updated_by: user_id,
              status: 2,
            });
          } else {
            // Have an error
            oTask.retry_count = oTask.retry_count !== undefined ? oTask.retry_count + 1 : 2;
            oTask = await app.service('agf-tasks').patch(oTask._id, {
              check_error: true,
              retry_count: oTask.retry_count,
              updated_by: user_id,
              $push: {
                error: [{
                  ...oLog.reply,
                  date: new Date(),
                }]
              },
              status: oTask.retry_count > oConfig.max_retry_count ? 6 : 1,
            });
          }

          oLog = await app.service('wms-logs').create(oLog);
          return {
            error: oLog.reply,
            log: oLog,
            send: !oLog.status ? true : false,
            task: oTask,
          };
        })
        .catch(async (error) => {
          logger.error('[AgfsForce/create] Error: %s', error.message || (typeof error === 'string' ? error : JSON.stringify(error)));
          oLog.reply = error.message || error;
          oLog.status = 0;

          oTask.retry_count = oTask.retry_count !== undefined ? oTask.retry_count + 1 : 2;
          await app.service('agf-tasks').patch(oTask._id, {
            check_error: true,
            retry_count: oTask.retry_count,
            updated_by: user_id,
            $push: typeof oLog.reply === 'string' ? {
              error: [{
                message: oLog.reply,
                date: new Date(),
              }]
            } : {
              error: [{
                ...oLog.reply,
                date: new Date(),
              }]
            },
            status: oTask.retry_count > oConfig.max_retry_count ? 6 : 1,
          });

          oLog = await app.service('wms-logs').create(oLog);
          throw new errors.BadRequest('Something went wrong to call robot API', oLog.reply);
        });
    } else {
      throw new errors.BadRequest('Already a task in progress');
    }
  }
};
