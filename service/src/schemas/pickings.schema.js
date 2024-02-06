const Joi = require('joi').extend(require('@joi/date'));

const MAX_LIMIT_DOUBLE = 999999999999;

const CREATE_SCHEMA = Joi.object().keys({
  INTERFACE_NAME: Joi.string().label('Interface name'),
  BATCHID: Joi.string().trim().max(30).required().label('Interface Batch ID'),
  DO_LIST: Joi.array().items(
    Joi.object().keys({
      DO_LIST_NO: Joi.string().trim().max(40).regex(/^[A-Z0-9]{1,37}-[0-9]{1,2}/, 'Format').required().label('Picking List No.'),
      DO_LIST_ITEM: Joi.array().items(
        Joi.object().keys({
          DO_DATE: Joi.date().format('YYYY/MM/DD').required().label('DO Receiving Date'),
          DO_CODE: Joi.string().trim().max(40).regex(/^[A-Z0-9]{1,40}/, 'Format').required().label('DO Code'),
          DOD_SEQ: Joi.string().trim().max(10).regex(/^[0-9]/, 'Numbers').required().label('DO Detail Sequence No.'),
          PLD_SEQ: Joi.string().trim().max(10).regex(/^[0-9]/, 'Numbers').required().label('PL Sequence No.'),
          STOCK_NO: Joi.string().trim().max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock No.'),
          PACK_KEY: Joi.string().trim().max(2).regex(/^[0-9]/, 'Numbers').allow(null, '').label('Pack Key'),
          ITM_NAME: Joi.string().max(1000).required().label('Stock name'),
          UOM: Joi.string().uppercase().allow(null, '').max(40).label('Stock item unit of measure'),
          PLANT: Joi.string().trim().uppercase().max(12).valid(null, 'ALC', 'LMA').allow(null).label('Warehouse Plant Code'),
          STO_LOC: Joi.string().uppercase().allow(null).label('Warehouse storage location'),
          BATCH_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').label('Stock Batch No.'),
          SERIAL_NO: Joi.valid(null, '').label('Stock item serial no.'),
          VAL_TYPE: Joi.string().allow(null, '').uppercase().max(100).label('SAP Valuation Type.'),
          STOCK_TYPE: Joi.string().uppercase().valid(null, 'UU').allow(null).label('Stock Type'),
          EXPIRY_DATE: Joi.date().allow(null, '').format('YYYY/MM/DD').label('Stock item expire date'),
          MANU_DATE: Joi.date().allow(null, '').format('YYYY/MM/DD').label('Stock item manufacture date'),
          SUG_PICK_QTY: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).required().label('Suggested Put Away quantity'),
          WES_LOC: Joi.string().uppercase().max(3).valid('AGV', 'AGF').label('WES Put Away Location'),
          PRIORITY: Joi.number().integer().min(1).default(10).required().label('Priority'),
        }),
      ).min(1).required(),
    })
  ).min(1).required().label('DO_LIST'),
});

const CANCEL_SCHEMA = Joi.object().keys({
  BATCHID: Joi.string().trim().max(30).required().label('Interface Batch ID'),
  DO_LIST: Joi.array().items(
    Joi.object().keys({
      DO_LIST_NO: Joi.string().trim().max(40).regex(/^[A-Z0-9]{1,37}-[0-9]{1,2}/, 'Format').required().label('Picking List No.'),
      DO_LIST_ITEM: Joi.array().items(
        Joi.object().keys({
          DO_DATE: Joi.date().format('YYYY/MM/DD').required().label('DO Receiving Date'),
          DO_CODE: Joi.string().trim().max(40).regex(/^[A-Z0-9]{1,40}/, 'Format').required().label('DO Code'),
          DOD_SEQ: Joi.string().trim().max(10).regex(/^[0-9]/, 'Numbers').required().label('DO Detail Sequence No.'),
          PLD_SEQ: Joi.string().trim().max(10).regex(/^[0-9]/, 'Numbers').required().label('PL Sequence No.'),
          STOCK_NO: Joi.string().trim().max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock No.'),
          PACK_KEY: Joi.string().trim().max(2).regex(/^[0-9]/, 'Numbers').allow(null, '').label('Pack Key'),
          ITM_NAME: Joi.string().max(1000).required().label('Stock name'),
          UOM: Joi.string().uppercase().allow(null, '').max(40).label('Stock item unit of measure'),
          PLANT: Joi.string().trim().uppercase().max(12).valid(null, 'ALC', 'LMA').label('Warehouse Plant Code'),
          STO_LOC: Joi.string().uppercase().allow(null).label('Warehouse storage location'),
          BATCH_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').label('Stock Batch No.'),
          SERIAL_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').label('Stock item serial no.'),
          VAL_TYPE: Joi.string().allow(null, '').uppercase().max(100).label('SAP Valuation Type.'),
          STOCK_TYPE: Joi.string().uppercase().valid(null, 'UU').allow(null).label('Stock Type'),
          EXPIRY_DATE: Joi.date().allow(null, '').format('YYYY/MM/DD').label('Stock item expire date'),
          MANU_DATE: Joi.date().allow(null, '').format('YYYY/MM/DD').label('Stock item manufacture date'),
          SUG_PICK_QTY: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).required().label('Suggested Put Away quantity'),
          WES_LOC: Joi.string().uppercase().max(3).valid('AGV', 'AGF').label('WES Put Away Location'),
          CANCEL_FLAG: Joi.string().trim().uppercase().valid('Y').label('Cancel Flag'),
        })
      ).min(1).required(),
    })
  ).min(1).required(),
});

const CALCULATE_SCHEMA = Joi.object().keys({
  order_id: Joi.string().trim().max(20).required().label('Order Id'),
});

const READY_SCHEMA = Joi.object().keys({
  items: Joi.array().items(
    Joi.object({
      STOCK_NO: Joi.string().trim().max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock No.'),
      ITM_NAME: Joi.string().max(1000).required().label('Stock name'),
      BATCH_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock Batch No.'),
      PACK_KEY: Joi.string().trim().max(2).regex(/^[0-9]/, 'Numbers').allow(null, '').label('Pack Key'),
      SERIAL_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock item serial no.'),
      VAL_TYPE: Joi.string().allow(null, '').uppercase().max(100).required().label('SAP Valuation Type.'),
      SHORT_COMING: Joi.boolean().required().label('Is Short Coming'),
      PICK_QTY: Joi.number().integer().label('Pick Quantity'),
      QTY: Joi.number().integer().min(0).required().label('Quantity'),
      DATE: Joi.date().label('Insert Date'),
    })
  ).min(1).required().label('Item List'),
  label: Joi.string().trim().max(10).required().label('Label'),
  order_id: Joi.string().trim().max(20).required().label('Order ID'),
  pallet_id: Joi.string().trim().uppercase().max(50).required().label('Pallet ID'),
  more_pallets: Joi.boolean().label('Has more pallets'),
});

const RELEASE_SCHEMA = Joi.object().keys({
  label: Joi.array().items(
    Joi.string().trim().max(10).label('Label'),
  ).label('Label'),
  order_id: Joi.string().trim().max(20).required().label('Order ID'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

const PROCESS_CALCULATE_SCHEMA = Joi.object().keys({
  order_id: Joi.string().trim().max(20).required().label('Order ID'),
  operation: Joi.string().valid('reserve', 'unlock').required().label('Operation'),
  pallets: Joi.array().items(
    Joi.string().trim().uppercase().max(50).required().label('Pallet ID'),
  ).min(1).required().label('Pallets'),
  calculate: Joi.any().label('Calculate Data'),
});

module.exports = {
  CALCULATE_SCHEMA,
  CANCEL_SCHEMA,
  CREATE_SCHEMA,
  PROCESS_CALCULATE_SCHEMA,
  READY_SCHEMA,
  RELEASE_SCHEMA,
};
