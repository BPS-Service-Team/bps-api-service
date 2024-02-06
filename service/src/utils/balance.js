const moment = require('moment');
const { iterateKeyExactly } = require('./conditional');

const getBalance = async (app, data) => {
  // Get all stocks with items
  const mongooseClient = app.get('mongooseClient'),
    model = mongooseClient.models['stocks'],
    mdlItems = mongooseClient.models['items'],
    oMatch = {
      pallet_id: {
        $exists: true,
        $nin: [null, ''],
      }
    };

  const results = await model.aggregate([
    { $match: oMatch }
  ]);

  // Get all items
  const allItems = await mdlItems.find().lean(),
    aLog = !data ? await app.service('wms-logs').find({
      query: {
        type: 'reconciliation',
        $limit: 1,
        $sort: {
          created_at: -1
        }
      }
    }) : { data: [data] },
    log = aLog.data.length ? aLog.data[0] : undefined;

  let aItems = [];
  // Get all different items
  for (let single of results) {
    if (!single.stocks) {
      continue;
    }

    for (let item of single.stocks) {
      let oItem = aItems.find(
        el => iterateKeyExactly(
          el, item,
          [
            ['stock_no', 'STOCK_NO'], ['batch_no', 'BATCH_NO'],
            ['pack_key', 'PACK_KEY'], ['val_type', 'VAL_TYPE']
          ]
        ) && el.wes_loc === 'AGF'
      );

      if (!oItem) {
        // Find the corresponding data from item collection
        let oExist = allItems.find(el => el.stock_no === item.STOCK_NO);

        if (oExist) {
          aItems.push({
            ...oExist,
            stock_no: item.STOCK_NO,
            pack_key: item.PACK_KEY,
            batch_no: item.BATCH_NO,
            val_type: item.VAL_TYPE,
            serial_no: item.SERIAL_NO,
            wes_loc: 'AGF',
            replenishment: 'N',
            total_qty: item.QTY,
            locations: [{
              qty: item.QTY,
              label: single.label,
              pallet_id: single.pallet_id,
            }],
          });
        }
      } else {
        oItem.total_qty += item.QTY;
        oItem.locations.push({
          qty: item.QTY,
          label: single.label,
          pallet_id: single.pallet_id,
        });
      }
    }
  }

  if (log) {
    let aSkuList = log.request?.body?.sku_list;

    if (aSkuList) {
      for (let item of aSkuList) {
        let oItem = aItems.find(el => iterateKeyExactly(
            el, item,
            ['sku_code', 'out_batch_code', 'pack_key', 'valuation_type']
          ) && el.wes_loc === 'AGV'),
          oExist = allItems.find(el => item.sku_code === el.stock_no),
          sReplenishment = 'N';

        if (!oItem) {
          if (oExist) {
            if (oExist.min_stock_lv_agv !== undefined && oExist.min_stock_lv_agv !== null) {
              let iSum = aSkuList.filter(
                el => el.sku_code === item.sku_code
              ).reduce((a, b) => a + b.amount, 0);

              if (iSum <= oExist.min_stock_lv_agv) {
                sReplenishment = 'Y';
              }
            }
          }

          aItems.push({
            sku_code: item.sku_code,
            out_batch_code: item.out_batch_code,
            valuation_type: item.valuation_type,
            batch_no: item.out_batch_code,
            itm_name: '',
            pack_key: item.pack_key,
            plant: '',
            serial_no: '',
            stock_no: item.sku_code,
            stock_type: 'UU',
            sto_loc: '',
            replenishment: sReplenishment,
            val_type: item.valuation_type,
            qty: item.amount,
            wes_loc: 'AGV',
            locations: [{
              qty: item.amount,
              label: item.shelf_bin_code,
            }],
          });
        } else {
          oItem.qty += item.amount;
          oItem.locations.push({
            qty: item.amount,
            label: item.shelf_bin_code,
          });
        }
      }
    }
  }

  let aPayload = {
    BATCHID: moment().format('YYYYMMDDHHmmss'),
    SB_LIST: [],
  };
  for (let item of aItems) {
    if (item.wes_loc === 'AGF') {
      let oExist = allItems.find(el => item.stock_no === el.stock_no);

      if (oExist) {
        if (oExist.min_stock_lv_agf !== undefined && oExist.min_stock_lv_agf !== null) {
          if (item.total_qty <= oExist.min_stock_lv_agf) {
            item.replenishment = 'Y';
          }
        }
      }
    }

    aPayload.SB_LIST.push({
      BAL_QTY: item.locations ? item.locations.reduce((a, b) => a + b.qty, 0) : item.qty,
      BATCH_NO: item.batch_no,
      ITM_NAME: item.itm_name,
      PACK_KEY: item.pack_key,
      PLANT: item.plant,
      PROJ_SEG: '',
      REPLENISHMENT: item.replenishment,
      SERIAL_NO: item.serial_no,
      STOCK_NO: item.stock_no,
      STOCK_TYPE: item.stock_type,
      STO_LOC: item.sto_loc,
      VAL_TYPE: item.val_type,
      VEND_SEG: '',
      WES_LOC: item.wes_loc,
      WES_LOC_DETAILS: item.locations ? item.locations.map(
        single => {
          return { WES_QTY: single.qty, WES_LOC: single.label, WES_PALLET_ID: single.pallet_id };
        }
      ) : undefined,
    });
  }

  return aPayload;
};

module.exports = {
  getBalance,
};
