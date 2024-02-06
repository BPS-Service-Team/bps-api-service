/* eslint-disable indent */
export const findItemIndexInArray = (items, item) =>
  items.findIndex(
    oItem =>
      oItem.STOCK_NO === item.STOCK_NO &&
      (oItem.BATCH_NO === null ||
        oItem.BATCH_NO?.toLowerCase() === item.BATCH_NO?.toLowerCase()) &&
      (oItem.SERIAL_NO === null ||
        oItem.SERIAL_NO?.toLowerCase() === item.SERIAL_NO?.toLowerCase()) &&
      (oItem.PACK_KEY === null ||
        oItem.PACK_KEY?.toLowerCase() === item.PACK_KEY?.toLowerCase()) &&
      (item.VAL_TYPE === null ||
        oItem.VAL_TYPE?.toLowerCase() === item.VAL_TYPE?.toLowerCase())
  );

export const findItemIndexInArrayEx = (items, item) =>
  items.findIndex(
    oItem =>
      oItem.STOCK_NO === item.STOCK_NO &&
      oItem.BATCH_NO === item.BATCH_NO &&
      oItem.SERIAL_NO === item.SERIAL_NO &&
      oItem.PACK_KEY === item.PACK_KEY &&
      oItem.VAL_TYPE === item.VAL_TYPE
  );

export const findItemIndexInArrayExactly = (items, item, orderDetail) =>
  orderDetail.agf.filter(a => a.STOCK_NO === item.STOCK_NO).length > 1
    ? items.findIndex(
        oItem =>
          oItem.STOCK_NO === item.STOCK_NO &&
          oItem.BATCH_NO?.toLowerCase() === item.BATCH_NO?.toLowerCase() &&
          oItem.PACK_KEY?.toLowerCase() === item.PACK_KEY?.toLowerCase() &&
          oItem.VAL_TYPE?.toLowerCase() === item.VAL_TYPE?.toLowerCase()
      )
    : items.findIndex(
        oItem =>
          oItem.STOCK_NO === item.STOCK_NO &&
          (oItem.BATCH_NO === null ||
            oItem.BATCH_NO?.toLowerCase() === item.BATCH_NO?.toLowerCase()) &&
          (oItem.SERIAL_NO === null ||
            oItem.SERIAL_NO?.toLowerCase() === item.SERIAL_NO?.toLowerCase()) &&
          (oItem.PACK_KEY === null ||
            oItem.PACK_KEY?.toLowerCase() === item.PACK_KEY?.toLowerCase()) &&
          (item.VAL_TYPE === null ||
            oItem.VAL_TYPE?.toLowerCase() === item.VAL_TYPE?.toLowerCase())
      );
