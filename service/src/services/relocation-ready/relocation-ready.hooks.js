const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow, iff, isProvider } = require('feathers-hooks-common');
const errors = require('@feathersjs/errors');
const moment = require('moment');

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [disallow()],
    get: [disallow()],
    create: [],
    update: [disallow()],
    patch: [disallow()],
    remove: [disallow()],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      iff(
        isProvider('rest'),
        async context => {
          const { items, order_id, pallet_id, workstation_id } = context.data,
            { user } = context.params,
            aOrder = await context.app.service('orders').find({
              query: {
                order_id,
                $limit: 1,
              },
            });

          if (!aOrder.total) {
            throw new errors.BadRequest(`The order with ID ${order_id} doesn't exist`);
          }

          const order = aOrder.data[0];

          let aAlreadyClose = [],
            aNotExist = [],
            aExceeds = [],
            aPickings = [],
            aPutaways = [],
            aSumItems = [],
            oConfig = {},
            oCurrentDetail,
            oResult = {
              result: true,
            };

          if (order.cancelled) {
            throw new errors.BadRequest('The order is with the status of canceled.');
          } else if (order.status !== 1 && order.status !== 2) {
            throw new errors.BadRequest('The order is in a status other than open');
          }

          // Check if all items are present in the order
          for (let item of items) {
            let blnExist = false;

            for (let oSingle of order.details) {
              if (
                item.STOCK_NO === oSingle.payload.STOCK_NO &&
                item.ITM_NAME === oSingle.payload.ITM_NAME &&
                item.PACK_KEY === oSingle.payload.PACK_KEY &&
                item.SERIAL_NO === oSingle.payload.SERIAL_NO
              ) {
                blnExist = true;

                if (item.QTY > oSingle.TRD_QTY) {
                  aExceeds.push(item.STOCK_NO);
                }

                if (item.SHORT_COMING) {
                  aAlreadyClose.push(item.STOCK_NO);
                  oSingle.payload.SHORT_COMING = item.SHORT_COMING || false;
                  oSingle.payload.QTY = item.QTY;
                }

                aSumItems.push(
                  JSON.parse(JSON.stringify(item))
                );

                if (oSingle.type === 'picking') {
                  aPickings.push(oSingle);
                } else if (oSingle.type === 'putaway') {
                  aPutaways.push(oSingle);
                }
              }
            }

            if (!blnExist) {
              aNotExist.push(item.STOCK_NO);
            }
          }

          if (aNotExist.length) {
            throw new errors.BadRequest(
              `The next stok numbers doesn't exists in the order: "${aNotExist.join(', ')}"`
            );
          }

          if (aExceeds.length) {
            throw new errors.BadRequest(
              `The income quantity of the stock numbers "${aExceeds.join(', ')}" is greater than the registered in the orders`
            );
          }

          if (aPickings.length) {
            const aAGFs = aPickings.filter(oItem => oItem.from === 'AGF'),
              aAGVs = aPickings.filter(oItem => oItem.from === 'AGV');

            if (aAGFs.length) {
              const aDetails = aAGFs.map(oItem => oItem.payload);
              const mongooseClient = context.app.get('mongooseClient'),
                model = mongooseClient.models.stocks;
              let oSData = [];

              await model.aggregate([
                {
                  $project: {
                    'pallet_id': 1,
                    'label': 1,
                    'stocks': 1,
                  },
                },
                { $unwind: '$stocks' },
                {
                  $match: {
                    'pallet_id': {
                      $exists: true,
                      $ne: null,
                    },
                    'stocks.STOCK_NO': {
                      $in: aDetails.map(oD => oD.STOCK_NO),
                    },
                    'stocks.ITM_NAME': {
                      $in: aDetails.map(oD => oD.ITM_NAME),
                    },
                    'stocks.PACK_KEY': {
                      $in: aDetails.map(oD => oD.PACK_KEY),
                    },
                    'stocks.SERIAL_NO': {
                      $in: aDetails.map(oD => oD.SERIAL_NO),
                    },
                  },
                },
              ])
                .then((data, error) => {
                  oSData = data;
                });

              let oCurrentStock;
              for (let oRecord of oSData) {
                let oExist = aSumItems.find(
                  item =>
                    item.STOCK_NO === oRecord.stocks.STOCK_NO &&
                    item.ITM_NAME === oRecord.stocks.ITM_NAME &&
                    item.PACK_KEY === oRecord.stocks.PACK_KEY &&
                    item.SERIAL_NO === oRecord.stocks.SERIAL_NO
                );

                if (oExist) {
                  oCurrentStock = oRecord;
                  oCurrentDetail = oExist;
                  break;
                }
              }

              if (!oCurrentStock) {
                throw new errors.BadRequest('Item not found in stocks');
              }

              const aRequestItems = [];
              aRequestItems.push({
                STOCK_NO: oCurrentDetail.STOCK_NO,
                ITM_NAME: oCurrentDetail.ITM_NAME,
                BATCH_NO: oCurrentDetail.BATCH_NO,
                PACK_KEY: oCurrentDetail.PACK_KEY,
                SERIAL_NO: oCurrentDetail.SERIAL_NO,
                VAL_TYPE: oCurrentDetail.VAL_TYPE,
                SHORT_COMING: oCurrentDetail.SHORT_COMING,
                QTY: oCurrentDetail.QTY,
              });

              const sSize = oCurrentStock.pallet_id[0];
              let sTaskId = `T${new Date().getTime()}`,
                oAgfRequest = {
                  order_id,
                  direction: 'out',
                  task_no: sTaskId,
                  type: 'create',
                  request: aRequestItems,
                  payload: {
                    lpn: workstation_id,
                    taskNo: sTaskId,
                    taskType: 'Inbound',
                    locationSource: oCurrentStock?.label,
                    locationDestination: workstation_id,
                    palletType: sSize === 'S' ? '800' : '1000',
                    checkWidth: 'N',
                    checkHeight: 'N',
                  },
                  created_by: user._id.toString(),
                };

              const register = await context.app.service('agf-tasks')
                .create(oAgfRequest);

              if (register.status === 'error') {
                throw new errors.BadRequest(
                  `Something went wrong in AGF call. ${
                    register.result.message || register.result
                  }`
                );
              } else if (register.status === 'fail') {
                throw new errors.BadRequest(
                  `AGF responsed with an error. Error (${
                    register.result.errorCode}): ${
                    register.result.errorMessage}`
                );
              } else {
                oResult = {
                  agf_task_no: sTaskId,
                };
              }
            }

            if (aAGVs.length) {
              const config = await context.app.service('configs').find({
                query: {
                  slug: {
                    $in: ['agv-api'],
                  },
                },
              });

              for (let oSingle of config.data) {
                for (let oItem of oSingle.elements) {
                  if (oItem.type === 'json') {
                    oConfig[oItem.slug.replace(/-/g, '_')] = JSON.parse(oItem.value);
                  } else {
                    oConfig[oItem.slug.replace(/-/g, '_')] = oItem.value;
                  }
                }
              }

              // Find if order id has "Requested" or "Start" status
              const aTasks = await context.app.service('agv-tasks').find({
                query: {
                  order_id: order.order_id,
                  status: 1,
                  $limit: 0,
                },
              });

              if (aTasks.total) {
                throw new errors.BadRequest(
                  `There is a task related to the order "${order.order_id}" which is already requested or started`
                );
              }

              let sCode = `${order.order_id}${
                  (order.type === 'putaway' || order.type === 'picking') ? '-1' : ''
                }`,
                aSkuList = [],
                aRequestItems = [];

              for (let oPicking of aAGVs) {
                const { payload } = oPicking;

                aSkuList.push({
                  amount: payload.TRD_QTY,
                  out_batch_code: payload.FR_BATCH_NO,
                  owner_code: oConfig.headers.user_id,
                  pack_key: payload.PACK_KEY,
                  sku_code: payload.STOCK_NO,
                  sku_level: 0,
                  sku_name: payload.ITM_NAME,
                  valuation_type: payload.FR_VAL_TYPE,
                });

                aRequestItems.push({
                  BATCH_NO: payload.FR_BATCH_NO,
                  ITM_NAME: payload.ITM_NAME,
                  OWNER_CODE: oConfig.headers.user_id,
                  PACK_KEY: payload.PACK_KEY,
                  QTY: payload.TRD_QTY,
                  SERIAL_NO: payload.SERIAL_NO,
                  STOCK_NO: payload.STOCK_NO,
                  VAL_TYPE: payload.FR_VAL_TYPE,
                });
              }

              let oAGVData = {
                  header: oConfig.headers,
                  body: {
                    order_amount: 1,
                    order_list: [
                      {
                        creation_date: new Date().getTime(),
                        order_type: 0,
                        out_order_code: sCode,
                        owner_code: oConfig.headers.user_id,
                        sku_list: aSkuList,
                      },
                    ],
                  },
                },
                oAgvRequest = {
                  receipt_code: sCode,
                  order_id: order.order_id,
                  order_type: order.type,
                  request: aRequestItems,
                  direction: 'out',
                  type: 'create',
                  payload: oAGVData,
                  created_by: user._id.toString(),
                };

              const register = await context.app.service('agv-tasks')
                .create(oAgvRequest);

              if (register) {
                oResult.agv_receipt_code = sCode;
              }

              // Change order status to "In process"
              await context.app.service('orders').patch(order._id, {
                status: 2,
              });
            }
          }

          if (aPutaways.length) {
            const aAGFs = aPutaways.filter(oItem => oItem.to === 'AGF'),
              aAGVs = aPutaways.filter(oItem => oItem.to === 'AGV');

            if (aAGVs.length) {
              const config = await context.app.service('configs').find({
                query: {
                  slug: {
                    $in: ['agv-api'],
                  },
                },
              });

              for (let oSingle of config.data) {
                for (let oItem of oSingle.elements) {
                  if (oItem.type === 'json') {
                    oConfig[oItem.slug.replace(/-/g, '_')] = JSON.parse(oItem.value);
                  } else {
                    oConfig[oItem.slug.replace(/-/g, '_')] = oItem.value;
                  }
                }
              }

              // Find if order id has "Requested" or "Start" tasks
              const aTasks = await context.app.service('agv-tasks').find({
                query: {
                  order_id: order.order_id,
                  status: 1,
                  $limit: 0,
                },
              });

              if (aTasks.total) {
                throw new errors.BadRequest(
                  `There is a task related to the order "${order.order_id}" which is requested or already started`
                );
              }

              let sCode = `${order.order_id}${
                  (order.type === 'putaway' || order.type === 'picking') ? '-1' : ''
                }`,
                aSkuList = [],
                aRequestItems = [];

              for (let oPutaway of aAGVs) {
                const { payload } = oPutaway;

                aSkuList.push({
                  amount: payload.TRD_QTY,
                  out_batch_code: payload.TO_BATCH_NO,
                  owner_code: oConfig.headers.user_id,
                  pack_key: payload.PACK_KEY,
                  sku_code: payload.STOCK_NO,
                  sku_level: 0,
                  sku_name: payload.ITM_NAME,
                  valuation_type: payload.TO_VAL_TYPE,
                });

                aRequestItems.push({
                  BATCH_NO: payload.TO_BATCH_NO,
                  ITM_NAME: payload.ITM_NAME,
                  OWNER_CODE: oConfig.headers.user_id,
                  PACK_KEY: payload.PACK_KEY,
                  QTY: payload.TRD_QTY,
                  SERIAL_NO: payload.SERIAL_NO,
                  STOCK_NO: payload.STOCK_NO,
                  VAL_TYPE: payload.TO_VAL_TYPE,
                });
              }

              let oAGVData = {
                  header: oConfig.headers,
                  body: {
                    receipt_amount: 1,
                    receipt_list: [
                      {
                        receipt_code: sCode,
                        type: 0,
                        creation_date: new Date().getTime(),
                        sku_list: aSkuList,
                      },
                    ],
                  },
                },
                oAgvRequest = {
                  receipt_code: sCode,
                  order_id: order.order_id,
                  order_type: order.type,
                  request: aRequestItems,
                  direction: 'in',
                  type: 'create',
                  payload: oAGVData,
                  created_by: user._id.toString(),
                };

              const register = await context.app.service('agv-tasks')
                .create(oAgvRequest);
              if (register) {
                oResult.agv_receipt_code = sCode;
              }

              // Change order status to "In process"
              await context.app.service('orders').patch(order._id, {
                status: 2,
              });
            }

            if (aAGFs.length) {
              if (!pallet_id) {
                throw new errors.BadRequest('The pallet id is required');
              }

              // Validate size pallet
              let sSize = pallet_id[0];
              if (['L', 'S'].indexOf(sSize) === -1) {
                throw new errors.BadRequest(
                  `The size "${sSize}" is not allowed`
                );
              }

              // Find if the pallet id is already in the stocks
              let aExist = await context.app.service('stocks').find({
                query: {
                  pallet_id,
                  $select: ['_id', 'label'],
                  $limit: 1,
                },
              });

              if (aExist.total === 0) {
                throw new errors.BadRequest(
                  `There is no reserved stock with pallet ID "${pallet_id}"`
                );
              } else if (aExist.total > 1) {
                throw new errors.BadRequest(
                  `There is more than one stock reserved with the pallet ID "${pallet_id}"`
                );
              }

              let sStockLabel = aExist.data[0].label;
              // Get general config to parse checks
              const config = await context.app.service('configs').find({
                query: {
                  slug: {
                    $in: ['general'],
                  },
                },
              });

              for (let oSingle of config.data) {
                for (let oItem of oSingle.elements) {
                  oConfig[oItem.slug.replace(/-/g, '_')] = oItem.value;
                }
              }

              oResult = {
                result: true,
              };

              // Find if order id have "Requested" or "Started" tasks
              const aTasks = await context.app.service('agf-tasks').find({
                query: {
                  order_id: order.order_id,
                  status: {
                    $in: [1, 2],
                  },
                  $limit: 0,
                },
              });

              if (aTasks.total) {
                throw new errors.BadRequest(
                  `There is already a task related to the order id "${order.order_id}" which is requested or started`
                );
              }

              const aRequestItems = [];
              for (let oPutaway of aAGFs) {
                const { payload } = oPutaway;

                aRequestItems.push({
                  STOCK_NO: payload.STOCK_NO,
                  ITM_NAME: payload.ITM_NAME,
                  BATCH_NO: payload.TO_BATCH_NO,
                  PACK_KEY: payload.PACK_KEY,
                  SERIAL_NO: payload.SERIAL_NO,
                  VAL_TYPE: payload.TO_VAL_TYPE,
                  SHORT_COMING: payload.SHORT_COMING || false,
                  QTY: payload.QTY || payload.TRD_QTY,
                });
              }

              let sTaskId = `T${new Date().getTime()}`,
                oAgfRequest = {
                  order_id: order.order_id,
                  direction: 'in',
                  task_no: sTaskId,
                  type: 'create',
                  request: aRequestItems,
                  check: (oConfig.check_width === 'Y' || oConfig.check_height === 'Y') ? true : false,
                  payload: {
                    lpn: sStockLabel,
                    taskNo: sTaskId,
                    taskType: 'Inbound',
                    locationSource: workstation_id,
                    locationDestination: sStockLabel,
                    palletType: sSize === 'S' ? '800' : '1000',
                    checkWidth: order.type === 'picking' ? 'N' : (oConfig.check_width || 'N'),
                    checkHeight: order.type === 'picking' ? 'N' : (oConfig.check_height || 'N'),
                  },
                  created_by: user._id.toString(),
                };

              const register = await context.app.service('agf-tasks').create(oAgfRequest, context.params);
              if (register) {
                oResult.agf_task_id = sTaskId;
              }

              // Change order status to "In process"
              await context.app.service('orders').patch(order._id, {
                status: 2,
              });
            }
          }

          context.result = oResult;

          return context;
        }
      )
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
    remove: []
  }
};
