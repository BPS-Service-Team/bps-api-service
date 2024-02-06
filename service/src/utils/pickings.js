const logger = require('../logger');

const createPicking = async (app, data, params, relocation) => {
  const operations = require('./putaways');
  const { user } = params;

  let oResult;
  try {
    params.provider = undefined;
    let aDoList = data.DO_LIST[0],
      aItems = aDoList.DO_LIST_ITEM,
      sPlCode = aDoList.DO_LIST_NO,
      sDoCode = sPlCode.split('-')[0],
      blnError = false;

    for (let oSingle of aItems) {
      if (oSingle.DO_CODE !== sDoCode) {
        blnError = true;
        break;
      }
    }

    if (blnError) {
      throw 'Found order lines with different GR_CODE\'s';
    }

    // Check if the order already exist
    let oExist = await app.service('orders').find({
      ...params,
      query: {
        order_id: sDoCode,
        type: 'picking',
        $limit: 0,
      },
    });

    if (oExist.total) {
      throw 'DO_CODE already exists';
    }

    let aMissingItems = [];
    for (let oSingle of aItems) {
      let aItem = await app.service('items').find({
          ...params,
          query: {
            stock_no: oSingle.STOCK_NO,
            $limit: 1,
          },
        }),
        oItem = aItem.data[0];

      if (!oItem) {
        aMissingItems.push(oSingle.STOCK_NO);
      }
    }

    if (aMissingItems.length) {
      throw `The following list of items are not in our records: ${aMissingItems.join(', ')}`;
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

    let aAgvSyncItems = [],
      aAgfList = [],
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

      if (oSingle.WES_LOC === 'AGV') {
        if (!aAgvSyncItems.find(row => row.STOCK_NO === oSingle.STOCK_NO)) {
          aAgvSyncItems.push(oSingle);
        }
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
          if (oItem[sKey] !== oSingle[sKey.toUpperCase()] && oSingle[sKey.toUpperCase()] !== undefined) {
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

    let order = await app.service('orders').create({
      order_id: sDoCode,
      interface_name: data.INTERFACE_NAME,
      batch_id: data.BATCHID,
      type: 'picking',
      status: 1,
      agv_status: !aAgvList.length ? -1 : 0,
      agf_status: !aAgfList.length ? -1 : 0,
      agv: aAgvList,
      agf: aAgfList,
      relocation,
      created_by: user._id.toString(),
    }, params);

    if (aAgvSyncItems.length) {
      await operations.syncAGVItems(app, data, params, aAgvSyncItems, 'picking');
    }

    if (aAgvList.length) {
      await operations.readyAgv(app, params, order);
    }

    oResult = {
      errno: 0,
      result: 'success',
      message: 'Insert Picking Success',
    };
  } catch (err) {
    logger.error('[createPicking] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
    oResult = {
      errno: 1,
      errors: err.errors || undefined,
      message: err.message || err,
      result: 'fail',
    };
  }

  params.provider = 'rest';
  return oResult;
};

const quickCheckOrderComplete = async (order, app, params, data) => {
  const operations = require('./putaways');
  // Check if already send the data to WMS
  const alreadySend = await app.service('wms-logs').find({
    query: {
      order_id: order.order_id,
      command: 'wms/send',
      $limit: 0
    }
  });

  if (alreadySend.total && [3, 4, 5].indexOf(order.status) > -1) {
    return;
  }

  let iCount = 0,
    aAllItems = order.agf,
    oNewData = {
      status: 2,
    },
    blnNeedUpdate = false;

  for (let oItem of aAllItems) {
    if (oItem.PICK_QTY !== undefined) {
      if (oItem.PICK_QTY >= 0) {
        iCount++;
      }
    }
  }

  let blnAGFComplete = false;
  // If the total number of item already task for agf, change flag
  if (iCount >= aAllItems.length) {
    blnAGFComplete = true;

    if (order.agf_status === 0) {
      blnNeedUpdate = true;
      oNewData.agf_status = 1;
    }
  }

  // Now check if the AGV is complete
  let blnAGVComplete = false,
    iAGVCount = 0;

  if (order.agv?.length) {
    let aAGVTasks = await app.service('agv-tasks').find({
      query: {
        order_id: order.order_id,
        $select: ['_id', 'order_id', 'status'],
      }
    });

    for (let oTask of aAGVTasks.data) {
      if (oTask.status === 2) {
        iAGVCount++;
      }
    }

    if (iAGVCount >= aAGVTasks.total) {
      blnAGVComplete = true;
    }
  } else {
    blnAGVComplete = true;
  }

  if (blnAGVComplete && order.agv_status === 0) {
    blnNeedUpdate = true;
    oNewData.agv_status = 1;
  }

  if (blnAGFComplete && blnAGVComplete) {
    blnNeedUpdate = true;
    if (!order.relocation) {
      operations.sendData2WMS(app, order, params, data);
      oNewData.status = order.cancel_on_finish ? 5 : 3;
    }
  }

  if (blnNeedUpdate) {
    await app.service('orders').patch(order._id, oNewData, { ...params, provider: undefined });
  }
};

module.exports = {
  createPicking,
  quickCheckOrderComplete,
};
