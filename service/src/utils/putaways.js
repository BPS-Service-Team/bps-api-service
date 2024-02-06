const axios = require('axios');
const moment = require('moment');
const { XMLParser } = require('fast-xml-parser');

const logger = require('../logger');
const { createPicking } = require('./pickings');
const { iterateKeyCond, iterateKeyExactly } = require('./conditional');

const IS_DEBUG = process.env.CONFIG_DEBUG_MOCK || false;

const oConfigKeys = {
  WMS_SND_PAL_RES: [
    'GR_DATE', 'GR_CODE', 'GRD_SEQ', 'GRA_SEQ', 'STOCK_NO', 'PACK_KEY', 'ITM_NAME',
    'UOM', 'PLANT', 'STO_LOC', 'BATCH_NO', 'SERIAL_NO', 'VAL_TYPE', 'STOCK_TYPE',
    'EXPIRY_DATE', 'MANU_DATE', 'SUG_PA_QTY', 'PA_QTY', 'WES_LOC'
  ],
  WMS_SND_PIL_RES: [
    'DO_DATE', 'DO_CODE', 'DOD_SEQ', 'PLD_SEQ', 'STOCK_NO', 'PACK_KEY', 'ITM_NAME',
    'UOM', 'PLANT', 'STO_LOC', 'BATCH_NO', 'SERIAL_NO', 'VAL_TYPE', 'STOCK_TYPE',
    'EXPIRY_DATE', 'MANU_DATE', 'SUG_PICK_QTY', 'PICK_QTY', 'WES_LOC'
  ],
  WMS_SND_SR_RES: [
    'RT_DATE', 'RT_CODE', 'RTD_SEQ', 'STOCK_NO', 'PACK_KEY', 'ITM_NAME', 'UOM',
    'PLANT', 'STO_LOC', 'BATCH_NO', 'SERIAL_NO', 'VAL_TYPE', 'STOCK_TYPE',
    'EXPIRY_DATE', 'MANU_DATE', 'SUG_PA_QTY', 'PA_QTY', 'WES_LOC',
  ],
  WMS_SND_SRE_RES: [
    'TR_DATE', 'PO_NO', 'TR_CODE', 'TRD_SEQ', 'STOCK_NO', 'PACK_KEY', 'ITM_NAME',
    'UOM', 'FR_PLANT', 'FR_STO_LOC', 'FR_BATCH_NO', 'FR_VAL_TYPE', 'FR_STOCK_TYPE',
    'TO_PLANT', 'TO_STO_LOC', 'TO_BATCH_NO', 'TO_VAL_TYPE', 'TO_STOCK_TYPE',
    'SERIAL_NO', 'TRD_QTY', 'TRD_WES_QTY', 'FR_LOC', 'TO_LOC'
  ],
};

const syncAGVItems = async (app, data, params, items, type, callback) => {
  let aEndpoints = await app.service('configs').find({
      query: {
        slug: 'agv-api',
      },
    }),
    oEndpoint = aEndpoints.data[0];

  if (oEndpoint) {
    let sMK = type === 'putaway' ? 'GR' :
        (type === 'picking' ? 'DO' : 'SR'),
      sLK = type === 'putaway' ? 'PA' :
        (type === 'picking' ? 'DO' : 'SR');

    let aGrList = data[`${sMK}_LIST`][0],
      sPlCode = aGrList[`${sLK}_LIST_NO`],
      sGrCode = sPlCode.split('-')[0],
      oConfig = {},
      aSkyLists = [];

    for (let oItem of oEndpoint.elements) {
      if (oItem.type === 'json') {
        oConfig[oItem.slug.replace(/-/g, '_')] = JSON.parse(oItem.value);
      } else {
        oConfig[oItem.slug.replace(/-/g, '_')] = oItem.value;
      }
    }

    for (let oSingle of items) {
      const aStockNoSpt = oSingle.STOCK_NO.split('_'),
        sWaresTypes3 = aStockNoSpt.length > 1 ? aStockNoSpt[0] : 0;

      aSkyLists.push({
        amount: oSingle.SUG_PA_QTY,
        gross_weight: oSingle.GROSS_WEIGHT,
        height: oSingle.HEIGHT,
        length: oSingle.LENGTH,
        owner_code: oConfig.headers.user_id,
        sku_code: oSingle.STOCK_NO,
        sku_level: 0,
        sku_name: oSingle.ITM_NAME,
        unit: oSingle.UOM,
        volume: oSingle.LENGTH ? parseFloat(parseFloat(oSingle.LENGTH * oSingle.WIDTH * oSingle.HEIGHT).toFixed(3)) : undefined,
        wares_type_code_1: oSingle.RACK_TYPE === 'A'
          ? 1
          : oSingle.RACK_TYPE === 'B'
            ? 2
            : oSingle.RACK_TYPE === 'C'
              ? 3
              : 4,
        wares_type_code_2: oSingle.SKU_CATEGORY === 'A'
          ? 1
          : oSingle.SKU_CATEGORY === 'B'
            ? 2
            : 3,
        wares_type_id_3: sWaresTypes3,
        width: oSingle.WIDTH,
      });
    }

    let oPayload = {
        header: oConfig.headers,
        body: {
          sku_list: aSkyLists,
        },
      },
      oLog = {
        type,
        from: {
          text: 'WES',
          domain: params.ip,
        },
        to: {
          text: 'AGV',
          domain: oConfig.url,
        },
        order_id: sGrCode,
        command: 'agvs/sync',
        request: oPayload,
        reply: {},
        created_by: params.user._id.toString(),
        status: 0,
      };
    
    const axiosReq = !IS_DEBUG ? {
      method: 'POST',
      url: `${oConfig.url}/geekplus/api/artemis/pushJson/skuInfoImport?${oConfig.query}`,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      data: oPayload,
    } : {
      method: 'GET',
      url: 'https://mocki.io/v1/325aeff4-b8e6-4fa7-86d9-2bf9af1d420a',
    };

    return axios(axiosReq)
      .then(async response => {
        oLog.status = 1;
        oLog.reply = response.data;

        const { body } = response.data;
        if (!body.success) {
          oLog.status = 0;
        }

        await app.service('wms-logs').create(oLog);
        if (callback) {
          callback();
        }
      })
      .catch(async error => {
        logger.error('[syncAGVItems] Error: %s', error.message || (typeof error === 'string' ? error : JSON.stringify(error)));
        oLog.status = 0;
        oLog.reply = error.message || error;

        await app.service('wms-logs').create(oLog);
        if (callback) {
          callback();
        }
      });
  }
};

const readyAgv = async (app, params, order) => {
  let oRequest = {
    order_id: order.order_id,
    items: [],
  };

  try {
    for (let oItem of order.agv) {
      oRequest.items.push({
        STOCK_NO: oItem.STOCK_NO,
        ITM_NAME: oItem.ITM_NAME,
        BATCH_NO: oItem.BATCH_NO,
        PACK_KEY: oItem.PACK_KEY,
        SERIAL_NO: oItem.SERIAL_NO,
        VAL_TYPE: oItem.VAL_TYPE,
      });
    }

    params.provider = 'rest';
    const result = await app.service('agv-ready').create(oRequest, params);
    return result;
  } catch (error) {
    let sError = `[readyAgv] ${error.name ? `${error.name}: ` : ''}${error.message ? error.message : ''}${error.errors ? `, data: ${JSON.stringify(error.errors)}` : ''}`;
    logger.error(sError);

    throw sError;
  }
};

const getAGVItemsNormalOrder = (order, data, aConfigKeys, sTag, aList) => {
  let aNewItems = [],
    aNewAgvItems = [];

  // If contain agv item, get the feedback
  if (order.agv.length && data?.body) {
    let aItemList = data?.body[order.type === 'picking' ? 'order_list' : 'receipt_list'],
      oOrderFeed = aItemList ? aItemList.find(
        item => item[order.type === 'picking' ? 'out_order_code' : 'receipt_code'] === `${order.order_id}-1`
      ) : undefined;

    if (oOrderFeed) {
      for (let oSingle of oOrderFeed.sku_list) {
        let oExist = order.agv.find(item => (
          item.STOCK_NO === oSingle.sku_code &&
          item.BATCH_NO === oSingle.out_batch_code
        ));

        if (!oExist) {
          oExist = order.agv.find(item => (
            item.STOCK_NO === oSingle.sku_code &&
            (item.BATCH_NO === null && oSingle.out_batch_code !== '')
          ));

          if (!oExist) {
            oExist = order.agv.find(item => item.STOCK_NO === oSingle.sku_code);
          }
        }

        if (oExist) {
          let oNew = {
              BATCH_NO: oSingle.out_batch_code,
              PACK_KEY: oSingle.pack_key,
              VAL_TYPE: oSingle.valuation_type,
            },
            sIndex = '';

          if (order.type === 'picking') {
            oNew.SUG_PICK_QTY = oSingle.plan_amount;
            oNew.PICK_QTY = oSingle.pickup_amount;
          } else {
            oNew.SUG_PA_QTY = oSingle.plan_amount;
            oNew.PA_QTY = oSingle.amount;
          }

          for (sIndex of aConfigKeys) {
            if (oNew[sIndex] === undefined && oExist[sIndex] !== undefined) {
              oNew[sIndex] = oExist[sIndex];
            }
          }

          if (oSingle.sku_reservation_1 !== undefined) {
            let aSplit = oSingle.sku_reservation_1.split(',');

            if (sTag === 'WMS_SND_PAL_RES') {
              oNew.GRD_SEQ = aSplit[0];
              oNew.GRA_SEQ = aSplit[1];
            } else if (sTag === 'WMS_SND_PIL_RES') {
              oNew.DOD_SEQ = aSplit[0];
              oNew.PLD_SEQ = aSplit[1];
            } else if (sTag === 'WMS_SND_SR_RES') {
              oNew.RTD_SEQ = aSplit[0];
            }
          }

          aNewAgvItems.push(oNew);
        }
      }
    }
  } else if (order.agv.length) {
    for (let oItem of order.agv) {
      let oCopy = {},
        oExist = aList.find(
          item => ['putaway', 'return'].indexOf(order.type) > -1 ? (iterateKeyExactly(
            item, oItem,
            ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
          ) && item['WES_LOC'] === 'AGV') : (iterateKeyCond(
            item, oItem,
            ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
          ) && item['WES_LOC'] === 'AGV')
        );

      if (!oExist) {
        oExist = {};
      }

      for (let sIndex of aConfigKeys) {
        if (oItem[sIndex] !== undefined) {
          oCopy[sIndex] = oItem[sIndex];
        }

        if (oExist[sIndex] !== undefined) {
          oCopy[sIndex] = oExist[sIndex];
        }
      }

      aNewAgvItems.push(oCopy);
    }
  }

  for (let oItem of order.agf) {
    let oCopy = {};

    for (let sIndex of aConfigKeys) {
      if (oItem[sIndex] !== undefined) {
        oCopy[sIndex] = oItem[sIndex];
      }
    }
    aNewItems.push(oCopy);
  }

  return aNewItems.concat(aNewAgvItems);
};

const getAllItemsRelocationOrder = async (main, data, configs, tag, app, request) => {
  // First get all orders data.
  let orders = await app.service('orders').find({
      query: {
        relocation: main.order_id,
        $select: ['_id', 'type', 'order_id', 'relocation', 'agv', 'agf'],
        $limit: 99
      }
    }),
    logs = await app.service('wms-logs').find({
      query: {
        order_id: {
          $in: orders.data.map(item => item.order_id),
        },
        command: 'agvs/feedback'
      }
    }),
    aNewItems = [], aPutaways = [], aPickings = [];

  // Add the log of the context
  if (data) {
    logs.data.push(data);
  }

  for (let oSingle of orders.data) {
    if (oSingle.type === 'putaway') {
      aPutaways = aPutaways.concat(oSingle.agv || []).concat(oSingle.agf || []);

      for (let oItem of aPutaways) {
        oItem.order_id = oSingle.order_id;
        oItem.type = 'putaway';
      }
    }

    if (oSingle.type === 'picking') {
      aPickings = aPickings.concat(oSingle.agv || []).concat(oSingle.agf || []);

      for (let oItem of aPickings) {
        oItem.order_id = oSingle.order_id;
        oItem.type = 'picking';
      }
    }
  }

  let allItems = [].concat(aPutaways || []).concat(aPickings || []);
  for (let oRequest of request) {
    let oNew = {}, sIndex = '';
    // First find item into putaway order
    let oExist = allItems.filter(item => item.STOCK_NO === oRequest.STOCK_NO).length > 1 ?
      aPutaways.find(item => iterateKeyExactly(
        item, oRequest,
        ['STOCK_NO', ['BATCH_NO', 'TO_BATCH_NO'], 'PACK_KEY', ['VAL_TYPE', 'TO_VAL_TYPE']]
      )) : aPutaways.find(item => iterateKeyCond(
        item, oRequest,
        ['STOCK_NO', ['BATCH_NO', 'TO_BATCH_NO'], 'PACK_KEY', ['VAL_TYPE', 'TO_VAL_TYPE']]
      ));

    // if not exist looking for into pickings items
    if (!oExist) {
      oExist = allItems.filter(item => item.STOCK_NO === oRequest.STOCK_NO).length > 1 ?
        aPickings.find(item => iterateKeyExactly(
          item, oRequest,
          ['STOCK_NO', ['BATCH_NO', 'TO_BATCH_NO'], 'PACK_KEY', ['VAL_TYPE', 'TO_VAL_TYPE']]
        )) : aPickings.find(item => iterateKeyCond(
          item, oRequest,
          ['STOCK_NO', ['BATCH_NO', 'TO_BATCH_NO'], 'PACK_KEY', ['VAL_TYPE', 'TO_VAL_TYPE']]
        ));

      // If not exist in putaway and picking skip this item
      if (!oExist) {
        continue;
      }
    }

    for (sIndex of configs) {
      if (oRequest[sIndex] !== undefined) {
        oNew[sIndex] = oRequest[sIndex];
      }

      if (oExist[sIndex] !== undefined) {
        oNew[sIndex] = oExist[sIndex];
      } else if (['TRD_WES_QTY'].indexOf(sIndex) > -1) {
        if (oExist.type === 'putaway') {
          oNew[sIndex] = oExist['PA_QTY'];
        } else {
          oNew[sIndex] = oExist['PICK_QTY'];
        }
      }
    }

    // Check if the item it's from AGV
    if (oExist.WES_LOC === 'AGV') {
      // Looking for into the feedback logs
      for (let log of logs.data) {
        let aItemList = log.request?.body[oExist.type === 'picking' ? 'order_list' : 'receipt_list'],
          oOrderFeed = aItemList ? aItemList.find(
            item => item[oExist.type === 'picking' ? 'out_order_code' : 'receipt_code'] === `${oExist.order_id}-1`
          ) : undefined;

        if (oOrderFeed) {
          let oBatch = oOrderFeed.sku_list.find(item =>
            oExist.STOCK_NO === item.sku_code &&
            oExist.BATCH_NO === item.out_batch_code
          );

          if (!oBatch) {
            oBatch = oOrderFeed.sku_list.find(item => (
              oExist.STOCK_NO === item.sku_code &&
              (oExist.BATCH_NO === null && item.out_batch_code !== '')
            ));

            if (!oBatch) {
              oBatch = oOrderFeed.sku_list.find(item => oExist.STOCK_NO === item.sku_code);
            }
          }

          if (oBatch) {
            oNew.TO_BATCH_NO = oBatch.out_batch_code;
            oNew.PACK_KEY = oBatch.pack_key;
            oNew.VAL_TYPE = oBatch.valuation_type;

            if (oExist.type === 'picking') {
              oNew.SUG_PICK_QTY = oBatch.plan_amount;
              oNew.PICK_QTY = oBatch.pickup_amount;
            } else {
              oNew.SUG_PA_QTY = oBatch.plan_amount;
              oNew.PA_QTY = oBatch.amount;
            }
          }
        }
      }
    }

    aNewItems.push(oNew);
  }

  return aNewItems;
};

const sendData2WMS = async (app, order, params, data) => {
  // Find in the WMS Log the corresponding wms-logs request
  const aLog = await app.service('wms-logs').find({
      query: {
        type: order.type,
        order_id: order.order_id,
        command: `orders/${order.type}`,
        $limit: 1,
        $sort: {
          created_at: -1
        }
      }
    }),
    { user } = params,
    log = aLog.data[0];

  if (log) {
    let request = log.request,
      wmsLog = {
        from: {
          text: 'WES',
          domain: params.headers.host,
        },
        to: {
          text: 'WMS',
          domain: '',
        },
        type: order.type,
        order_id: order.order_id,
        command: 'wms/send',
        reply: {},
        status: 0,
        created_by: user._id.toString(),
      },
      aEndpoints = await app.service('configs').find({
        query: {
          slug: 'wms-api'
        }
      }),
      oEndpoint = aEndpoints.data[0],
      oConfig = {};

    for (let oItem of oEndpoint.elements) {
      oConfig[oItem.slug.replace(/-/g, '_')] = oItem.value;
    }

    let sAction = oConfig[`${order.type}_action`];

    if (sAction) {
      let sTag = sAction.substr(sAction.lastIndexOf('/') + 1, sAction.length),
        aConfigKeys = oConfigKeys[sTag],
        sXML = '',
        sKey = order.type === 'putaway' ? 'GR'
          : order.type === 'picking' ? 'DO'
            : order.type === 'relocation' ? 'SRE' : 'SR',
        oBody = request[`${sKey}_LIST`][0],
        aList = oBody[`${sKey}_LIST_ITEM`];

      if (aList !== undefined) {
        if (order.type !== 'relocation') {
          oBody[`${sKey}_LIST_ITEM`] = getAGVItemsNormalOrder(order, data, aConfigKeys, sTag, aList);
        } else {
          oBody[`${sKey}_LIST_ITEM`] = await getAllItemsRelocationOrder(order, data, aConfigKeys, sTag, app, aList);
        }
      }

      let sRequest = JSON.stringify(request);
      sRequest = sRequest.replace(/&/ig, '&amp;');
      sXML = `<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><${sTag} xmlns="http://tempuri.org/"><sJson>${sRequest}</sJson></${sTag}></s:Body></s:Envelope>`;

      wmsLog.request = sXML;
      wmsLog.to.domain = oConfig.url;
      return axios({
        method: 'POST',
        url: oConfig.url,
        headers: {
          'Authorization': oConfig.authorization,
          'Content-type': 'text/xml;charset="utf-8"',
          'SOAPAction': sAction,
        },
        data: sXML,
      })
        .then(async response => {
          if (response.status === 200) {
            wmsLog.status = 1;
            wmsLog.reply = response.data;

            const parser = new XMLParser();
            let oParsed = parser.parse(response.data);
            if (oParsed) {
              const aKeys = ['s:Envelope', 's:Body', `${sTag}Response`, `${sTag}Result`];
              for (const sKey2 of aKeys) {
                if (oParsed[sKey2]) {
                  oParsed = oParsed[sKey2];
                } else {
                  oParsed = null;
                }
              }
              if (oParsed) {
                const oResponse = JSON.parse(oParsed);
                if (oResponse && oResponse.errno !== 0) {
                  wmsLog.status = 0;
                  wmsLog.reply = oResponse?.message || 'error';

                  await app.service('orders').patch(order._id, { pending_feedback: true });
                }
              }
            }
          } else {
            wmsLog.status = 0;
            wmsLog.reply = response;

            await app.service('orders').patch(order._id, { pending_feedback: true });
          }

          await app.service('wms-logs').create(wmsLog);
        })
        .catch(async error => {
          logger.error('[sendData2WMS] Error: %s', error.message || (typeof error === 'string' ? error : JSON.stringify(error)));
          wmsLog.status = 0;
          if (error?.response?.data) {
            wmsLog.reply = error.response?.data;
          } else if (error?.message) {
            wmsLog.reply = error.message;
          } else {
            wmsLog.reply = error;
          }

          await app.service('wms-logs').create(wmsLog);
          await app.service('orders').patch(order._id, { pending_feedback: true });
        });
    }
  }
};

const checkPendingTasks = async (app, params) => {
  try {
    // Get the general config to parse the checks
    const aConfig = await app.service('configs').find({
        query: {
          slug: {
            $in: ['general', 'agf-api', 'agv-api']
          }
        }
      }),
      config = aConfig.data.find(item => item.slug === 'general'),
      agfApi = aConfig.data.find(item => item.slug === 'agf-api'),
      agvApi = aConfig.data.find(item => item.slug === 'agv-api');

    let oConfig = {};
    for (let oItem of config.elements) {
      oConfig[oItem.slug.replace(/-/g, '_')] = oItem.value;
    }

    let oAgvConfig = {};
    for (let oItem of agvApi.elements) {
      if (oItem.type === 'json') {
        oAgvConfig[oItem.slug.replace(/-/g, '_')] = JSON.parse(oItem.value);
      } else {
        oAgvConfig[oItem.slug.replace(/-/g, '_')] = oItem.value;
      }
    }

    let oAgfConfig = {};
    for (let oItem of agfApi.elements) {
      oAgfConfig[oItem.slug.replace(/-/g, '_')] = oItem.value;
    }

    // Check if exist an pending task, to initialize
    const aPendingAGFTasks = await app.service('agf-tasks').Model.aggregate([
        {
          $match: {
            status: {
              $in: [1, 2], // -- Request, In process
            },
          }
        }, {
          $sort: {
            created_at: 1,
          }
        }, {
          $lookup: {
            from: 'orders',
            localField: 'order_id',
            foreignField: 'order_id',
            as: 'order'
          }
        }, {
          $unwind: '$order'
        }
      ]),
      { user } = params;

    if (aPendingAGFTasks.length) {
      let oInProcess = aPendingAGFTasks.find(item => item.status === 2);

      if (!oInProcess) {
        let task;

        // Check if exist relocation order
        task = aPendingAGFTasks.find(item => item.order.type === 'relocation');

        if (!task) {
          // Check out and is picking
          task = aPendingAGFTasks.find(
            item => item.direction === 'out' && item.order.type === 'picking'
          );

          if (!task) {
            // Check in and is putaway
            task = aPendingAGFTasks.find(
              item => item.direction === 'in' && item.order.type === 'putaway'
            );

            if (!task) {
              // Otherwise get the first task in the array
              task = aPendingAGFTasks[0];
            }
          }
        }

        let order = task.order,
          oPayload = {
            lpn: task.location_destination,
            taskNo: task.task_no,
            taskType: 'Inbound',
            locationSource: task.location_source,
            locationDestination: task.location_destination,
            palletType: task.pallet_type,
            checkWidth: order.type === 'picking' ? 'N' : (oConfig.check_width || 'N'),
            checkHeight: order.type === 'picking' ? 'N' : (oConfig.check_height || 'N'),
          },
          oLog = {
            type: order.type,
            from: {
              text: 'WES',
              domain: params.ip,
            },
            to: {
              text: 'AGF',
              domain: oAgfConfig.url,
            },
            order_id: task.order_id,
            command: 'agfs/create',
            request: oPayload,
            reply: {},
            created_by: user._id.toString(),
            status: 0,
          },
          oAxiosReq = !IS_DEBUG ? {
            method: 'POST',
            url: `${oAgfConfig.url}/api/createTask`,
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

        return axios(oAxiosReq)
          .then(async response => {
            const { data } = response;
            oLog.reply = data;
            oLog.status = !data.success ? 0 : 1;

            if (oLog.status) {
              // Update task status to 2 - In process
              await app.service('agf-tasks').patch(task._id, {
                status: 2,
              }, params);
            } else {
              // Have an error
              task.retry_count = task.retry_count !== undefined ? task.retry_count + 1 : 2;
              await app.service('agf-tasks').patch(task._id, {
                check_error: true,
                retry_count: task.retry_count,
                $push: {
                  error: [{
                    ...data,
                    date: new Date(),
                  }]
                },
                status: task.retry_count > (oConfig.max_retry_count || 3) ? 6 : 1,
              }, params);
            }

            await app.service('wms-logs').create(oLog);
            checkPendingTasks(app, params);
          })
          .catch(async error => {
            logger.error('[checkPendingTasks/agf] Error: %s', error.message || (typeof error === 'string' ? error : JSON.stringify(error)));
            oLog.status = 0;
            oLog.reply = error.message || error;

            task.retry_count = task.retry_count !== undefined ? task.retry_count + 1 : 2;
            await app.service('agf-tasks').patch(task._id, {
              check_error: true,
              retry_count: task.retry_count,
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
              status: task.retry_count > (oConfig.max_retry_count || 3) ? 6 : 1,
            }, params);

            await app.service('wms-logs').create(oLog);
            checkPendingTasks(app, params);
          });
      }
    }

    const aPendingAGVTasks = await app.service('agv-tasks').Model.aggregate([
      {
        $match: {
          status: 0,
        },
      }, {
        $sort: {
          created_at: -1,
        }
      }, {
        $lookup: {
          from: 'orders',
          localField: 'order_id',
          foreignField: 'order_id',
          as: 'order'
        }
      }, {
        $unwind: '$order'
      }
    ]);

    // Check if exists AGV tasks pending
    if (aPendingAGVTasks.length) {
      // First check if exist one with out direction (picking)
      let task = aPendingAGVTasks.find(item => item.direction === 'out');

      if (!task) {
        // Otherwise get the first task in the array
        task = aPendingAGVTasks[0];
      }

      let order = task.order,
        sCode = `${order.order_id}${
          ['putaway', 'picking', 'return'].indexOf(order.type) > -1 ? '-1' : ''
        }`,
        aSkuList = [],
        aRequestItems = [],
        sQtyKey = ['putaway', 'return'].indexOf(order.type) > -1
          ? 'SUG_PA_QTY'
          : 'SUG_PICK_QTY';

      for (let oSingle of order.agv) {
        let sSequence;
        if (oSingle.GRD_SEQ) {
          sSequence = `${oSingle.GRD_SEQ},${oSingle.GRA_SEQ}`;
        } else if (oSingle.DOD_SEQ) {
          sSequence = `${oSingle.DOD_SEQ},${oSingle.PLD_SEQ}`;
        } else if (oSingle.RTD_SEQ) {
          sSequence = `${oSingle.RTD_SEQ}`;
        }

        let oNew = order.type === 'picking' ? {
          amount: oSingle[sQtyKey],
          expiration_date: oSingle.EXPIRY_DATE ? moment(oSingle.EXPIRY_DATE, 'YYYY/MM/DD').toDate().getTime() : null,
          out_batch_code: oSingle.BATCH_NO,
          owner_code: oAgvConfig.headers.user_id,
          pack_key: oSingle.PACK_KEY || null,
          production_date: oSingle.MANU_DATE ? moment(oSingle.MANU_DATE, 'YYYY/MM/DD').toDate().getTime() : null,
          sku_code: oSingle.STOCK_NO,
          sku_level: 0,
          valuation_type: oSingle.VAL_TYPE || null,
        } : {
          amount: oSingle[sQtyKey],
          expiration_date: oSingle.EXPIRY_DATE ? moment(oSingle.EXPIRY_DATE, 'YYYY/MM/DD').toDate().getTime() : null,
          out_batch_code: oSingle.BATCH_NO,
          owner_code: oAgvConfig.headers.user_id,
          pack_key: oSingle.PACK_KEY || null,
          production_date: oSingle.MANU_DATE ? moment(oSingle.MANU_DATE, 'YYYY/MM/DD').toDate().getTime() : null,
          sku_code: oSingle.STOCK_NO,
          sku_level: 0,
          sku_name: oSingle.ITM_NAME,
          valuation_type: oSingle.VAL_TYPE || null,
        };

        if (sSequence) {
          oNew.sku_reservation_1 = sSequence;
        }
        aSkuList.push(oNew);

        aRequestItems.push({
          BATCH_NO: oSingle.BATCH_NO,
          ITM_NAME: oSingle.ITM_NAME,
          OWNER_CODE: oAgvConfig.headers.user_id,
          PACK_KEY: oSingle.PACK_KEY,
          QTY: oSingle[sQtyKey],
          SERIAL_NO: oSingle.SERIAL_NO,
          SKU_LEVEL: 0,
          STOCK_NO: oSingle.STOCK_NO,
          VAL_TYPE: oSingle.VAL_TYPE,
        });
      }

      let oAGVData = {
          header: oAgvConfig.headers,
          body: order.type === 'picking' ? {
            order_amount: aSkuList.length,
            order_list: [{
              warehouse_code: oAgvConfig.headers.warehouse_code,
              out_order_code: sCode,
              owner_code: oAgvConfig.headers.user_id,
              order_type: 0,
              creation_date: new Date().getTime(),
              sku_list: aSkuList,
            }]
          } : {
            receipt_amount: aSkuList.length,
            receipt_list: [{
              receipt_code: sCode,
              type: 0,
              creation_date: new Date().getTime(),
              sku_list: aSkuList
            }]
          },
        },
        oAgvRequest = {
          receipt_code: sCode,
          order_id: order.order_id,
          request: aRequestItems,
          direction: order.type === 'picking' ? 'out' : 'in',
          type: 'create',
          payload: oAGVData,
          created_by: user._id.toString(),
        },
        oLog2 = {
          type: order.type,
          from: {
            text: 'WES',
            domain: params.ip,
          },
          to: {
            text: 'AGV',
            domain: oAgvConfig.url,
          },
          order_id: order.order_id,
          command: 'agvs/create',
          request: oAgvRequest.payload,
          reply: {},
          created_by: user._id.toString(),
          status: 0,
        };

      const axiosReq = !IS_DEBUG ? {
        method: 'POST',
        url: `${oAgvConfig.url}/geekplus/api/artemis/pushJson/receiptNoteImport?${oAgvConfig.query}`,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        data: oAgvRequest.payload,
      } : {
        method: 'GET',
        url: 'https://mocki.io/v1/325aeff4-b8e6-4fa7-86d9-2bf9af1d420a',
      };

      axios(axiosReq)
        .then(async response => {
          let blnHaveError = false;

          oLog2.reply = response.data;
          oLog2.status = 1;
          const { body } = response.data;
          if (!body.success) {
            oLog2.status = 0;
          }

          if (oLog2.status) {
            await app.service('agv-tasks').patch(task._id, {
              status: 1,
            }, params);
          } else {
            blnHaveError = true;

            // Have an error
            task.retry_count = task.retry_count !== undefined ? task.retry_count + 1 : 2;
            await app.service('agv-tasks').patch(task._id, {
              retry_count: task.retry_count,
              status: task.retry_count > (oConfig.max_retry_count || 3) ? 4 : 1,
            }, params);
          }

          await app.service('wms-logs').create(oLog2);
          checkPendingTasks(app, params);
        })
        .catch(async error => {
          logger.error('[checkPendingTasks/Agv] Error: %s', error.message || (typeof error === 'string' ? error : JSON.stringify(error)));
          oLog2.reply = error.message || error;
          oLog2.status = 0;

          // Have an error
          task.retry_count = task.retry_count !== undefined ? task.retry_count + 1 : 2;
          await app.service('agv-tasks').patch(task._id, {
            retry_count: task.retry_count,
            status: task.retry_count > (oConfig.max_retry_count || 3) ? 4 : 1,
          }, params);

          await app.service('wms-logs').create(oLog2);
          checkPendingTasks(app, params);
        });
    }
  } catch (err) {
    logger.error('[checkPendingTasks] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
  }
};

const relocationOrderComplete = async (order, app, params, data) => {
  // Get all orders corresponding to relocation
  const allOrders = await app.service('orders').find({
      query: {
        relocation: order.relocation,
        $select: ['_id', 'order_id', 'type', 'relocation', 'status'],
        $limit: 99,
      }
    }),
    iTotalComplete = allOrders.data?.filter(item => [3, 4, 5].indexOf(item.status) > -1)?.length || -1;

  if (iTotalComplete === allOrders.data.length) {
    const orders = await app.service('orders').find({
        query: {
          order_id: order.relocation,
          $limit: 1,
        }
      }),
      main = orders.data.length ? orders.data[0] : undefined;

    await sendData2WMS(app, main, params, data);
    // Change status or the main order
    await app.service('orders').Model.findOneAndUpdate({ _id: main._id }, { status: 3 });
  }
};

const checkIsOrderComplete = async (order_id, app, params, data) => {
  // Find the corresponding order
  try {
    const aOrder = await app.service('orders').find({
        query: {
          order_id,
        }
      }),
      order = aOrder.data[0],
      stocks = await app.service('stocks').Model.find({
        stocks: {
          $elemMatch: {
            ORDER_ID: order_id,
          }
        }
      }).lean();

    // Check if already send the data to WMS
    const alreadySend = await app.service('wms-logs').find({
      query: {
        order_id,
        command: 'wms/send',
        $limit: 0
      }
    });

    if (alreadySend.total && [3, 4].indexOf(order.status) > -1) {
      return;
    }

    let oNewData = {
        status: order.status > 2 ? order.status : 2,
        agf: [],
      },
      iCount = 0,
      blnNeedUpdate = false;

    if (
      order.type === 'picking' ||
      order.type === 'putaway' ||
      order.type === 'return'
    ) {
      // Only check if the AGF items is complete
      let aSumItems = [],
        aAllItems = order.agf;

      // Sum the quantities in the stocks with the records
      for (let oItem of aAllItems) {
        let oCopy = JSON.parse(JSON.stringify({ ...oItem, QTY: 0 }));

        for (let oRecord of stocks) {
          // Find the item into the stock
          let oExist = oRecord.stocks.find(
            item => ['putaway', 'return'].indexOf(order.type) > -1 ? (iterateKeyExactly(
              item, oCopy,
              ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
            ) && item.ORDER_ID === order_id) : (iterateKeyCond(
              item, oCopy,
              ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
            ) && item.ORDER_ID === order_id)
          );

          // If exist, sum the quantity to the copy
          if (oExist) {
            if (oCopy.QTY) {
              oCopy.QTY += oExist.QTY;
            } else {
              oCopy.QTY = oExist.QTY;
            }
          }
        }

        aSumItems.push(oCopy);
      }

      // Check if the AGF order is complete or need updated
      for (let oCopy of aSumItems) {
        let oItem = aAllItems.find(
          item => ['putaway', 'return'].indexOf(order.type) > -1 ? iterateKeyExactly(
            item, oCopy,
            ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
          ) : aAllItems.filter(item2 => item2.STOCK_NO === oCopy.STOCK_NO).length > 1
            ? iterateKeyExactly(
              item, oCopy,
              ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
            ) : iterateKeyCond(
              item, oCopy,
              ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
            )
        );

        if (oItem) {
          if (order.type === 'putaway' || order.type === 'return') {
            if (oCopy.QTY >= oItem.SUG_PA_QTY || oCopy.SHORT_COMING) {
              blnNeedUpdate = true;

              oItem.PA_QTY = oCopy.QTY;
              oItem.SHORT_COMING = oCopy.SHORT_COMING || false;
              if (oItem.WES_LOC === 'AGF') {
                iCount++;
              }
            } else if (oItem.CANCEL_FLAG === 'Y') {
              iCount++;
            }
          } else if (order.type === 'picking') {
            if (oCopy.PICK_QTY !== undefined) {
              if (oCopy.PICK_QTY >= 0 && oItem.WES_LOC === 'AGF') {
                iCount++;
              }
            }
          }

          if (oItem.WES_LOC === 'AGF') {
            oNewData.agf.push(oItem);
          }
        }
      }

      let blnAGFComplete = false;
      // If the total number of item already task for agf, change flag
      if (iCount >= oNewData.agf.length) {
        blnAGFComplete = true;

        if (order.agf_status === 0) {
          blnNeedUpdate = true;
          oNewData.agf_status = 1;
        }
      }

      let aPickingOrderItems = [],
        aRelocationOrderItems = [];

      if (order.agf?.length) {
        let aAGFTasks = await app.service('agf-tasks').find({
          query: {
            order_id,
            $select: ['_id', 'order_id', 'status', 'request', 'cancel_on_finish'],
          },
        });

        if (aAGFTasks.total) {
          for (let oTask of aAGFTasks.data) {
            if (oTask.status === 4 && oTask.cancel_on_finish) {
              if (order.type === 'putaway' || order.type === 'return') {
                aPickingOrderItems = aPickingOrderItems.concat(oTask.request);
              } else if (order.type === 'picking') {
                aRelocationOrderItems = aRelocationOrderItems.concat(oTask.request);
              }
            }
          }
        }
      }

      // Now check if the AGV is complete
      let blnAGVComplete = false,
        iAGVCount = 0;

      if (order.agv?.length) {
        let aAGVTasks = await app.service('agv-tasks').find({
          query: {
            order_id,
            $select: ['_id', 'order_id', 'request', 'status', 'cancel_on_finish'],
          }
        });

        for (let oTask of aAGVTasks.data) {
          if (oTask.status === 2) {
            iAGVCount++;
            if (oTask.cancel_on_finish) {
              aPickingOrderItems = aPickingOrderItems.concat(oTask.request);
            }
          } else if (oTask.status === 3) {
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
          sendData2WMS(app, order, params, data);
        }
        if (order.status !== 5) {
          oNewData.status = 3;
        }

        if (aRelocationOrderItems.length) {
          let aOrderItems = [];
          let sGrCode = '';
          for (let oSingle of order.agf) {
            let oItem = aRelocationOrderItems.find(
              item => ['putaway', 'return'].indexOf(order.type) > -1 ? iterateKeyExactly(
                item, oSingle,
                ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
              ) : iterateKeyCond(
                item, oSingle,
                ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
              ));

            if (oItem) {
              aOrderItems.push(oSingle);
              sGrCode = oSingle.DO_CODE;
            }
          }
          let oRelocationOrder = {
            BATCHID: `${new Date().getTime()}`,
            SRE_LIST: [
              {
                SRE_LIST_NO: `RL${sGrCode}`,
                SRE_LIST_ITEM: aOrderItems.map(oElem => {
                  return {
                    TR_DATE: oElem.DO_DATE,
                    TR_CODE: `RL${oElem.DO_CODE}`,
                    TRD_SEQ: oElem.DOD_SEQ,
                    STOCK_NO: oElem.STOCK_NO,
                    PACK_KEY: oElem.PACK_KEY,
                    ITM_NAME: oElem.ITM_NAME,
                    UOM: oElem.UOM,
                    FR_PLANT: oElem.PLANT,
                    FR_STO_LOC: oElem.WES_LOC,
                    FR_BATCH_NO: oElem.BATCH_NO,
                    FR_VAL_TYPE: oElem.VAL_TYPE,
                    FR_STOCK_TYPE: oElem.STOCK_TYPE,
                    TO_PLANT: oElem.PLANT,
                    TO_STO_LOC: oElem.WES_LOC,
                    TO_BATCH_NO: oElem.BATCH_NO,
                    TO_VAL_TYPE: oElem.VAL_TYPE,
                    TO_STOCK_TYPE: oElem.STOCK_TYPE,
                    SERIAL_NO: oElem.SERIAL_NO,
                    TRD_QTY: oElem.SUG_PICK_QTY, // validate qty
                    FR_LOC: 'WMS',
                    TO_LOC: oElem.WES_LOC,
                    PRIORITY: oElem.PRIORITY,
                  };
                }),
              },
            ],
          };

          oNewData.status = 5;
        }

        if (aPickingOrderItems.length) {
          // create picking
          const sSK = order.type === 'return' ? 'RT' : 'GR';
          let aOrderItems = [];
          let sGrCode = '';
          const aAllOrderItems = order.agf.concat(order.agv);
          for (let oSingle of aAllOrderItems) {
            let oItem = aPickingOrderItems.find(
              item => ['putaway', 'return'].indexOf(order.type) > -1 ? iterateKeyExactly(
                item, oSingle,
                ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
              ) : iterateKeyCond(
                item, oSingle,
                ['STOCK_NO', 'BATCH_NO', 'PACK_KEY', 'VAL_TYPE']
              ));

            if (oItem) {
              aOrderItems.push(oSingle);
              sGrCode = oSingle[`${sSK}_CODE`];
            }
          }

          let sSuffix = order.type === 'return' ? 'SRC' : 'GRC';

          let oPickingOrder = {
            BATCHID: `${new Date().getTime()}`,
            DO_LIST: [
              {
                DO_LIST_NO: `${sGrCode}${sSuffix}-1`,
                DO_LIST_ITEM: aOrderItems.map(oItem => {
                  const sCode = oItem[`${sSK}_CODE`];

                  return {
                    DO_DATE: oItem[`${sSK}_DATE`],
                    DO_CODE: `${sCode}${sSuffix}`,
                    DOD_SEQ: order.type === 'return' ? oItem.RTD_SEQ : oItem.GRA_SEQ,
                    PLD_SEQ: order.type === 'return' ? oItem.RTD_SEQ : oItem.GRD_SEQ,
                    STOCK_NO: oItem.STOCK_NO,
                    PACK_KEY: oItem.PACK_KEY,
                    ITM_NAME: oItem.ITM_NAME,
                    PLANT: oItem.PLANT,
                    STO_LOC: oItem.STO_LOC,
                    BATCH_NO: oItem.BATCH_NO,
                    SERIAL_NO: oItem.SERIAL_NO,
                    VAL_TYPE: oItem.VAL_TYPE,
                    STOCK_TYPE: oItem.STOCK_TYPE,
                    EXPIRY_DATE: oItem.EXPIRY_DATE,
                    MANU_DATE: oItem.MANU_DATE,
                    SUG_PICK_QTY: oItem.PA_QTY || 0,
                    WES_LOC: oItem.WES_LOC,
                    PRIORITY: oItem.PRIORITY,
                  };
                }),
              },
            ],
          };

          const oPickingResponse = await createPicking(app, oPickingOrder, { ...params, provider: undefined });
          await app.service('wms-logs').create(
            {
              type: 'picking',
              from: {
                text: 'WES',
                domain: params.ip,
              },
              to: {
                text: 'WES',
                domain: params.ip,
              },
              order_id: `${sGrCode}${sSuffix}`,
              command: 'orders/picking',
              request: oPickingOrder,
              reply: oPickingResponse,
              status: 1,
            }
          );
          oNewData.status = 5;
        }
      }
    }

    if (blnNeedUpdate) {
      await app.service('orders').patch(order._id, oNewData, { ...params, provider: undefined });

      // Check if order corresponding to a relocation parent order
      if (order.relocation) {
        await relocationOrderComplete(order, app, params, data);
      }
    }
  } catch (err) {
    logger.error('[checkIsOrderComplete] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
  }
};

module.exports = {
  checkIsOrderComplete,
  checkPendingTasks,
  readyAgv,
  sendData2WMS,
  syncAGVItems,
};
