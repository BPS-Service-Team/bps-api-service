const joiOptions = require('../../../utils/joi.options').options();
const returnSchema = require('../../../schemas/stock-return.schemas');
const Schema = require('../../../schemas/putaways.schema');
const operations = require('../../../utils/putaways');
const logger = require('../../../logger');

const fakeStepByStep = async (app, params, order) => {
  let aGeneral = await app.service('configs').find({
      query: {
        slug: 'general',
      },
    }),
    oGeneral = aGeneral.data[0];

  if (oGeneral) {
    let oConfig = {};

    for (let oItem of oGeneral.elements) {
      oConfig[oItem.slug.replace(/-/g, '_')] = oItem.value;
    }

    if (oConfig.debug_mode === 'true') {
      if (order.order_id.startsWith(oConfig.prefix_debug_agf)) {
        // First scan and reserve
        await app.service('scan-pallet').create({
          order_id: order.order_id,
          pallet_id: 'S' + order.order_id,
          operation: 'reserve',
        });

        let oPayload = {
          label: 'WS1',
          order_id: order.order_id,
          pallet_id: 'S' + order.order_id,
          task_no: 'T' + order.order_id,
          items: []
        };

        for (let oItem of order.agf) {
          oPayload.items.push({
            STOCK_NO: oItem.STOCK_NO,
            ITM_NAME: oItem.ITM_NAME,
            BATCH_NO: oItem.BATCH_NO,
            PACK_KEY: oItem.PACK_KEY,
            SERIAL_NO: oItem.SERIAL_NO,
            VAL_TYPE: oItem.VAL_TYPE,
            SHORT_COMING: oItem.SHORT_COMING || false,
            QTY: oItem.SUG_PA_QTY,
          });
        }

        params.provider = 'rest';
        await app.service('pallet-ready').create(oPayload, params);
      }
    }
  }
};

exports.PutawaysCreate = class PutawaysCreate {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    let oValidation, oResult, sRelocation;
    const { user } = params,
      { type } = this.options,
      app = this.app;

    let sGrCode = '', oOrder;
    try {
      delete data['created_by'];
      if (type === 'putaway') {
        if (data?.relocation) {
          sRelocation = data.relocation;
          delete data.relocation;
        }
        oValidation = await Schema.CREATE_SCHEMA.validate(data, joiOptions);
      } else if (type === 'return') {
        oValidation = await returnSchema.CREATE_SCHEMA.validate(data, joiOptions);
      } else {
        throw `Type '${type}' isn't supported`;
      }

      if (oValidation.error) {
        throw oValidation.error.message;
      }

      params.provider = undefined;
      let sMK = type === 'putaway' ? 'GR' : 'SR',
        sSK = type === 'putaway' ? 'GR' : 'RT',
        sLK = type === 'putaway' ? 'PA' : 'SR';

      let aGrList = data[`${sMK}_LIST`][0],
        aItems = aGrList[`${sMK}_LIST_ITEM`],
        sPlCode = aGrList[`${sLK}_LIST_NO`],
        blnError = false;

      sGrCode = sPlCode.split('-')[0];
      // Check all order lines have the same GR CODE
      for (let oSingle of aItems) {
        if (oSingle[`${sSK}_CODE`] !== sGrCode) {
          blnError = true;
          break;
        }
      }

      if (blnError) {
        throw `Found order lines with different ${sSK}_CODE's`;
      }
      let aAgvSyncItems = [];
      
      for (let oSingle of aItems) {
        if (oSingle.WES_LOC === 'AGV') {
          if (!aAgvSyncItems.find(row => row.STOCK_NO === oSingle.STOCK_NO)) {
            aAgvSyncItems.push(oSingle);
          }
        }
      }

      if (aAgvSyncItems.length) {
        await operations.syncAGVItems(app, data, params, aAgvSyncItems, type);
      }

      // Check if the order already exist
      let oExist = await app.service('orders').find({
        ...params,
        query: {
          order_id: sGrCode,
          type,
          $limit: 0,
        },
      });

      if (oExist.total) {
        throw sSK + '_CODE already exists';
      }

      let aKeys = [
        'cbm',
        'gross_weight',
        'height',
        'itm_name',
        'length',
        'long_desc',
        'min_stk_lv',
        'min_stock_lv_agf',
        'min_stock_lv_agv',
        'net_weight',
        'plant',
        'stock_no',
        'stock_type',
        'uom',
        'width',
      ];

      let aAgfList = [],
        aAgvList = [];

      // Iterate the item list, and check if already exist
      for (let oSingle of aItems) {
        let aItem = await app.service('items').find({
            ...params,
            query: {
              stock_no: oSingle.STOCK_NO,
              $limit: 1,
            },
          }),
          oItem = aItem.data[0];

        let oNew = {};
        for (let sKey of aKeys) {
          if (oSingle[sKey.toUpperCase()] !== undefined) {
            oNew[sKey] = oSingle[sKey.toUpperCase()];
          }
        }

        if (oSingle.WES_LOC === 'AGF') {
          aAgfList.push(oSingle);
        } else if (oSingle.WES_LOC === 'AGV') {
          aAgvList.push(oSingle);
        }

        if (!oItem) {
          await app.service('items').create(oNew);
        } else {
          // We check if any of the values of the following keys change
          let aChanges = [
              'cbm',
              'gross_weight',
              'height',
              'itm_name',
              'length',
              'net_weight',
              'uom',
              'width',
            ],
            blnChanges = false;

          for (let sKey of aChanges) {
            if (oItem[sKey] !== oSingle[sKey.toUpperCase()]) {
              blnChanges = true;
              break;
            }
          }

          if (blnChanges) {
            delete oNew['stock_no'];
            await app.service('items').patch(oItem._id, oNew);
          }
        }
      }

      oOrder = await app.service('orders').create(
        {
          order_id: sGrCode,
          interface_name: data.INTERFACE_NAME,
          batch_id: data.BATCHID,
          type,
          status: 1, // open
          agv_status: !aAgvList.length ? -1 : 0,
          agf_status: !aAgfList.length ? -1 : 0,
          agv: aAgvList,
          agf: aAgfList,
          relocation: sRelocation,
          created_by: user._id.toString(),
        },
        params
      );

      if (!sRelocation && aAgvList.length) {
        operations.readyAgv(app, params, oOrder);
      }

      if (aAgfList.length) {
        fakeStepByStep(app, params, oOrder);
      }

      params.provider = 'rest';
      oResult = {
        errno: 0,
        result: 'success',
        message: `Insert ${
          type === 'putaway' ? 'Put Away List' :
            (type === 'return' ? 'Stock Return Record' : '')
        } Success`,
      };
    } catch (err) {
      logger.error('[PutawaysCreate/create] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
      params.provider = 'rest';
      oResult = {
        code: 500,
        errno: 1,
        message: err.message || err,
        result: 'fail',
        errors: err.errors || undefined,
      };
    }

    return oResult;
  }
};
