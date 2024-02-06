const { readyAgv } = require('./putaways');
const logger = require('../logger');

const createRelocation = async (app, data, params) => {
  const { user } = params;

  let oResult;
  try {
    params.provider = undefined;

    // Iterate item list to create corresponding orders
    const [oSreList] = data.SRE_LIST,
      aItemList = oSreList.SRE_LIST_ITEM,
      sListNo = oSreList.SRE_LIST_NO,
      sTrCode = sListNo.split('-')[0];

    let blnError = false;
    for (let oSingle of aItemList) {
      if (oSingle.TR_CODE !== sTrCode) {
        blnError = true;
        break;
      }
    }

    if (blnError) {
      throw 'Found order lines with different GR_CODE\'';
    }

    let oExist = await app.service('orders').find({
        ...params,
        query: {
          order_id: sTrCode,
          type: 'relocation',
          $limit: 0,
        }
      }),
      oPutOrder, oPicOrder;

    if (oExist.total) {
      throw 'TR_CODE already exist';
    }

    let aDetails = [];
    for (let oItem of aItemList) {
      const { FR_LOC: from, TO_LOC: to, TRD_SEQ: seq, } = oItem;

      if (from === 'WMS') {
        aDetails.push({
          from,
          payload: oItem,
          seq,
          to,
          type: 'putaway',
        });
      } else {
        if (to === 'WMS') {
          aDetails.push({
            from,
            payload: oItem,
            seq,
            to,
            type: 'picking',
          });
        } else if (to === 'AGF' || to === 'AGV') {
          aDetails.push({
            from,
            payload: oItem,
            seq,
            to,
            type: 'picking',
          });
          aDetails.push({
            from,
            payload: oItem,
            seq,
            to,
            type: 'putaway',
          });
        }
      }
    }

    await app.service('orders').create(
      {
        order_id: sTrCode,
        interface_name: data.INTERFACE_NAME,
        batch_id: data.BATCHID,
        type: 'relocation',
        details: aDetails,
        status: 1,
        created_by: user._id.toString(),
      },
      params,
    );

    const aPutaways = aDetails.filter(oItem => oItem.type === 'putaway'),
      aPickings = aDetails.filter(oItem => oItem.type === 'picking');

    if (aPutaways.length) {
      const oPutawayPayload = {
        relocation: sTrCode,
        BATCHID: data.BATCHID,
        GR_LIST: [
          {
            PA_LIST_NO: `${sTrCode}A-1`,
            GR_LIST_ITEM: aPutaways.map(({ payload, seq }) => ({
              GR_DATE: payload.TR_DATE,
              GR_CODE: `${sTrCode}A`,
              GRD_SEQ: `${seq}`,
              GRA_SEQ: `${seq}`,
              STOCK_NO: payload.STOCK_NO,
              PACK_KEY: payload.PACK_KEY,
              ITM_NAME: payload.ITM_NAME,
              UOM: payload.UOM,
              LENGTH: payload.LENGTH,
              WIDTH: payload.WIDTH,
              HEIGHT: payload.HEIGHT,
              CBM: payload.CBM,
              NET_WEIGHT: payload.NET_WEIGHT,
              GROSS_WEIGHT: payload.GROSS_WEIGHT,
              PLANT: payload.TO_PLANT,
              STO_LOC: payload.TO_STO_LOC,
              BATCH_NO: payload.TO_BATCH_NO,
              SERIAL_NO: payload.SERIAL_NO,
              VAL_TYPE: payload.TO_VAL_TYPE,
              STOCK_TYPE: payload.TO_STOCK_TYPE,
              SUG_PA_QTY: payload.TRD_QTY,
              WES_LOC: payload.TO_LOC,
              PRIORITY: payload.PRIORITY,
              EXPIRY_DATE: payload?.EXPIRY_DATE,
              MANU_DATE: payload?.MANU_DATE,
              MIN_STOCK_LV_AGV: payload?.MIN_STOCK_LV_AGV,
              MIN_STOCK_LV_AGF: payload?.MIN_STOCK_LV_AGF,
              RACK_TYPE: payload?.RACK_TYPE,
              SKU_CATEGORY: payload?.SKU_CATEGORY,
            })),
          },
        ],
      };

      oPutOrder = await app.service('orders/putaway').create(oPutawayPayload, params);
      if (!aPickings.length) {
        const aPutawayrOrder = await app.service('orders').find({
          query: {
            order_id: `${sTrCode}A`,
            $limit: 1,
          }
        });
        const oPutawayrOrder = aPutawayrOrder.data[0];
        if (oPutawayrOrder) {
          if (oPutawayrOrder.agv.length) {
            await readyAgv(app, params, oPutawayrOrder);
          }
        }
      }
    }

    if (aPickings.length) {
      const oPickingPayload = {
        relocation: sTrCode,
        BATCHID: `${new Date().getTime()}`,
        DO_LIST: [
          {
            DO_LIST_NO: `${sTrCode}B-1`,
            DO_LIST_ITEM: aPickings.map(({ payload, seq }) => {
              return {
                DO_DATE: payload.TR_DATE,
                DO_CODE: `${sTrCode}B`,
                DOD_SEQ: `${seq}`,
                PLD_SEQ: `${seq}`,
                STOCK_NO: payload.STOCK_NO,
                PACK_KEY: payload.PACK_KEY,
                ITM_NAME: payload.ITM_NAME,
                PLANT: payload.FR_PLANT,
                STO_LOC: payload.FR_STO_LOC,
                BATCH_NO: payload.FR_BATCH_NO,
                SERIAL_NO: payload.SERIAL_NO,
                VAL_TYPE: payload.FR_VAL_TYPE,
                STOCK_TYPE: payload.FR_STOCK_TYPE,
                SUG_PICK_QTY: payload.TRD_QTY,
                WES_LOC: payload.FR_LOC,
                PRIORITY: payload.PRIORITY,
              };
            }),
          },
        ],
      };

      oPicOrder = await app.service('orders/picking').create(oPickingPayload, params);
    }

    if (oPicOrder !== undefined && oPutOrder !== undefined) {
      const order = await app.service('orders').find({
        query: {
          order_id: `${sTrCode}A`,
          $select: ['_id'],
          $limit: 1,
        }
      });

      if (order.total) {
        await app.service('orders').patch(order.data[0]._id, { status: 6 });
      }
    }

    oResult = {
      errno: 0,
      message: 'Insert Relocation Success',
      result: 'success',
    };
  } catch (err) {
    logger.error('[createRelocation] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
    oResult = {
      code: 500,
      errno: 1,
      message: err.message || err,
      result: 'fail',
      errors: err.errors || undefined,
    };
  }

  return oResult;
};

module.exports = {
  createRelocation,
};
