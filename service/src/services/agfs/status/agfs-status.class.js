const Schema = require('../../../schemas/agfs.schema');
const { getCustomOptions } = require('../custom.functions');
const moment = require('moment');
const logger = require('../../../logger');

exports.AgfsStatus = class AgfsStatus {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    const app = this.app,
      { deviceName, code } = data,
      user_id = params?.user?._id.toString() || undefined;

    let oResult = {}, blnSave = false;
    try {
      let response = await Schema.STATUS_SCHEMA.validate(data, getCustomOptions());
      if (response.error) {
        throw response.error.message;
      }

      // Check if the device name already exist
      const agf = await app.service('agfs').find({
          query: {
            device_name: deviceName,
            $limit: 1,
          }
        }),
        aConfig = await app.service('configs').find({
          query: {
            'elements.slug': 'recurrent-log-agf',
          }
        }),
        config = aConfig.total ? aConfig.data[0] : undefined;

      // If not exist, then create it
      if (!agf.total) {
        await app.service('agfs').create({
          device_name: deviceName,
          code,
          status: 0, // busy
        }, params);
      } else {
        if (config) {
          // Get the last log corresponding to status
          const aLast = await app.service('wms-logs').find({
              query: {
                status: 1,
                command: 'agfs/status',
                $limit: 1,
                $sort: {
                  created_at: -1
                }
              }
            }),
            last = aLast.total ? aLast.data[0] : undefined;

          if (last) {
            let oEndDate = moment(last.created_at),
              oInitDate = moment();

            if (oInitDate.diff(oEndDate, 'minutes') > config.value) {
              blnSave = true;
            } else if (last.request.code !== code) {
              blnSave = true;
            }
          } else {
            blnSave = true;
          }
        }

        if (blnSave) {
          const mongooseClient = app.get('mongooseClient'),
            model = mongooseClient.models.wmsLogs;

          params.$send_notification = true;
          await model.create({
            from: {
              text: 'AGF',
              domain: params.ip,
            },
            to: {
              text: 'WES',
              domain: params.headers.host,
            },
            command: 'agfs/status',
            request: data,
            reply: {
              errno: 0,
              result: 'success',
              message: 'Insert Record Success'
            },
            status: 1,
            created_by: user_id,
            created_at: new Date(),
          });
        }

        // Otherwise update the code
        await app.service('agfs').patch(agf.data[0]._id, {
          updated_by: user_id,
          code,
        }, params);
        params.provider = undefined;
      }

      oResult = {
        errno: 0,
        result: 'success',
        message: 'Insert Record Success'
      };
    } catch (err) {
      logger.error('[AgfsStatus/create] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
      oResult = {
        errno: 1,
        message: err.message || err,
        result: 'fail',
        errors: err.errors || undefined,
      };
    }

    return oResult;
  }
};
