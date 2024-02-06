const csv = require('csv-stringify');
const fs = require('fs');
const moment = require('moment');

const balance = require('../../../utils/balance');
const Schema = require('../../../schemas/agvs.schema');
const logger = require('../../../logger');
const { getCustomOptions } = require('../../agfs/custom.functions');
const { removeDuplicates } = require('../../../utils');

exports.AgvsReconciliation = class AgvsReconciliation {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    const app = this.app;
    let oResult = {}, wmsLog, newRecord,
      mongooseClient = this.app.get('mongooseClient'),
      model = mongooseClient.models.wmsLogs;

    try {
      delete data.created_by;
      if (!data.fromWeb) {
        let response = await Schema.IR_RECONCILIATION_SCHEMA.validate(data, getCustomOptions());
        if (response.error) {
          throw response.error.message;
        }
      }

      oResult = {
        body: {
          success: true,
        },
        header: {
          message: 'Call successfully!.',
          msgCode: '200',
        },
      };
    } catch (err) {
      logger.error('[AgvsReconciliation/create] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));

      oResult = {
        body: {
          success: false,
        },
        header: {
          message: err.message || err,
          msgCode: '500',
        },
      };
    }

    try {
      let oLog = {
        from: {
          text: 'AGV',
          domain: params.ip,
        },
        to: {
          text: 'WES',
          domain: params.headers.host,
        },
        type: 'reconciliation',
        order_id: '-9999999999',
        command: 'agvs/reconciliation',
        request: data,
        reply: oResult,
        status: !oResult.body.success ? 0 : 1,
        created_by: params.user._id,
        created_at: new Date(),
      };
      const currentLog = await model.create(oLog);

      let dataLogs = [];
      if (!data.fromWeb) {
        let firstDate = new Date(),
          secondDate = new Date();

        firstDate.setMinutes(firstDate.getMinutes() - 10);
        secondDate.setMinutes(secondDate.getMinutes() + 10);
        dataLogs = await model.find({
          created_at: {
            $gte: firstDate,
            $lt: secondDate,
          }
        }).lean();

        // If only exist 1, return request.
        if (dataLogs.length === 1) {
          params.provider = undefined;
          return oResult;
        }
      }

      // Join exist reconciliation data
      if (dataLogs.length > 1) {
        for (const single of dataLogs) {
          if (single._id.toString() !== currentLog._id.toString()) {
            if (single.request?.body?.sku_list && oLog.request?.body?.sku_list) {
              oLog.request.body.sku_list = oLog.request.body.sku_list.concat(single.request.body.sku_list);
            }
          }
        }
      }

      wmsLog = {
        from: {
          text: 'WES',
          domain: params.headers.host,
        },
        to: {
          text: 'WMS',
          domain: '',
        },
        type: 'balance',
        order_id: '-9999999999',
        command: 'wms/balance',
        reply: {},
        status: 0,
        created_by: params.user._id,
        created_at: new Date(),
      };

      let aEndpoints = await app.service('configs').find({
          query: {
            slug: 'wms-api'
          }
        }),
        oEndpoint = aEndpoints.data[0],
        oConfig = {};

      for (let oItem of oEndpoint.elements) {
        oConfig[oItem.slug.replace(/-/g, '_')] = oItem.value;
      }

      const pathCsv = process.env.CSV_PATH || 'logs',
        arrPayload = [],
        oPayload = await balance.getBalance(app, oLog);

      oPayload?.SB_LIST?.map((item) => {
        if (item) {
          item.WES_LOC_DETAILS?.map((wesLocDetail) => {
            const objPayload = {
              'Warehouse_code': 'W01',
              'Report_Date': moment().format('YYYYMMDD'),
              'Report_Time': moment().format('HHmm'),
              'Material_Number': item.STOCK_NO || '',
              'Qty': wesLocDetail.WES_QTY?.toString() || '',
              'Batch': item.BATCH_NO || '',
              'BIN_Location': wesLocDetail.WES_LOC || '',
              'Pallet_ID': wesLocDetail.WES_PALLET_ID || '',
              'Location': item.WES_LOC || '',
              'Valuation_type': item.VAL_TYPE || '',
            };
            arrPayload.push(objPayload);
          });
        }
      });

      const payloadNoDuplicates = removeDuplicates(arrPayload);
      if (data.fromWeb) {
        oResult.body.data = payloadNoDuplicates;
      }

      const actualFilePath = `${pathCsv}/WESReconciliation.csv`;
      if (fs.existsSync(actualFilePath)) {
        fs.unlinkSync(actualFilePath);
      }

      csv.stringify(
        payloadNoDuplicates,
        {
          header: true,
          delimiter: ';',
          quoted_string: true,
          quoted_empty: true,
        },
        (err, output) => {
          if (err) {
            console.log('Error creating csv file', err);
          } else {
            fs.appendFileSync(actualFilePath, output);
          }
        }
      );
    } catch (err) {
      if (wmsLog) {
        if (newRecord) {
          await model.findOneAndUpdate({ _id: newRecord._id }, {
            status: 0,
            reply: err.message || err,
            updated_at: new Date(),
          });
        } else {
          wmsLog.status = 0;
          wmsLog.reply = err.message || err;

          await model.create(wmsLog);
        }
      }

      logger.error('[AgvsReconciliation/create] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
    }

    params.provider = undefined;
    return oResult;
  }
};
