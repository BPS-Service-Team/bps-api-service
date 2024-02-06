const Joi = require('joi').extend(require('@joi/date'));

const MAX_LIMIT_DOUBLE = 999999999999;

const CANCEL_SCHEMA = Joi.object().keys({
  BATCHID: Joi.string().trim().max(30).required().label('Interface Batch ID'),
  SRE_LIST: Joi.array().items(
    Joi.object().keys({
      SRE_LIST_NO: Joi.string().trim().max(40).regex(/^[A-Z0-9]{1,37}-[0-9]{1,2}/, 'Format').required().label('Stock Return List No.'),
      SRE_LIST_ITEM: Joi.array().items(
        Joi.object().keys({
          TR_DATE: Joi.date().format('YYYY/MM/DD').required().label('SRE creation Date'),
          PO_NO: Joi.string().trim().max(20).allow(null, '').label('SAP PO No.'),
          TR_CODE: Joi.string().trim().max(40).regex(/^[A-Z0-9]{1,40}/, 'Format').required().label('SRE Code'),
          TRD_SEQ: Joi.string().trim().max(10).regex(/^[0-9]/, 'Numbers').required().label('SRE Detail Sequence No.'),
          STOCK_NO: Joi.string().trim().max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock No.'),
          PACK_KEY: Joi.string().trim().max(2).regex(/^[0-9]/, 'Numbers').allow(null, '').label('Pack Key'),
          ITM_NAME: Joi.string().max(1000).required().label('Stock item name'),
          UOM: Joi.string().uppercase().allow(null, '').max(40).label('Stock item unit of measure'),
          FR_PLANT: Joi.string().trim().uppercase().max(12).valid(null, 'ALC', 'LMA').label('From Plant Code'),
          FR_STO_LOC: Joi.string().uppercase().allow(null).label('From warehouse location'),
          FR_BATCH_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').label('From Stock Batch No.'),
          FR_VAL_TYPE: Joi.string().allow(null, '').uppercase().max(100).label('From Valuation Type'),
          FR_STOCK_TYPE: Joi.string().uppercase().valid('UU').label('From Stock Type'),
          TO_PLANT: Joi.string().trim().uppercase().max(12).valid(null, 'ALC', 'LMA').label('From Plant Code'),
          TO_STO_LOC: Joi.string().uppercase().allow(null).label('From warehouse location'),
          TO_BATCH_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').label('From Stock Batch No.'),
          TO_VAL_TYPE: Joi.string().allow(null, '').uppercase().max(100).label('From Valuation Type'),
          TO_STOCK_TYPE: Joi.string().uppercase().valid('UU').label('From Stock Type'),
          SERIAL_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').label('Stock item serial no.'),
          TRD_QTY: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).required().label('Suggested Put Away quantity'),
          FR_LOC: Joi.string().uppercase().max(3).valid('AGV', 'AGF', 'WMS').label('From Location'),
          TO_LOC: Joi.string().uppercase().max(3).valid('AGV', 'AGF', 'WMS').label('To Location'),
          CANCEL_YN: Joi.string().trim().uppercase().valid('Y', 'N').label('Cancelation flag'),
          MIN_STOCK_LV_AGV: Joi.number().allow(null).label('Minimum Stock Level for AGV'),
          MIN_STOCK_LV_AGF: Joi.number().allow(null).label('Minimum Stock Level for AGF'),
          RACK_TYPE: Joi.string().trim().allow(null, '').max(10).label('Rack Type'),
          SKU_CATEGORY: Joi.string().trim().allow(null, '').max(10).label('SKU Category'),
        }),
      ).min(1).required(),
    }),
  ).min(1).required(),
});

const CREATE_SCHEMA = Joi.object().keys({
  INTERFACE_NAME: Joi.string().label('Interface name'),
  BATCHID: Joi.string().trim().max(30).required().label('Interface Batch ID'),
  SRE_LIST: Joi.array().items(
    Joi.object().keys({
      SRE_LIST_NO: Joi.string().trim().max(40).regex(/^[A-Z0-9]{1,37}-[0-9]{1,2}/, 'Format').required().label('Stock Return List No.'),
      SRE_LIST_ITEM: Joi.array().items(
        Joi.object().keys({
          TR_DATE: Joi.date().format('YYYY/MM/DD').required().label('SRE creation Date'),
          PO_NO: Joi.string().trim().max(20).allow(null, '').label('SAP PO No.'),
          TR_CODE: Joi.string().trim().max(40).regex(/^[A-Z0-9]{1,40}/, 'Format').required().label('SRE Code'),
          TRD_SEQ: Joi.string().trim().max(10).regex(/^[0-9]/, 'Numbers').required().label('SRE Detail Sequence No.'),
          STOCK_NO: Joi.string().trim().max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock No.'),
          PACK_KEY: Joi.string().trim().max(2).regex(/^[0-9]/, 'Numbers').allow(null, '').label('Pack Key'),
          ITM_NAME: Joi.string().max(1000).required().label('Stock item name'),
          UOM: Joi.string().uppercase().allow(null, '').max(40).label('Stock item unit of measure'),
          LENGTH: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).label('Length (M)'),
          WIDTH: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).label('Width (M)'),
          HEIGHT: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).label('Height (M)'),
          CBM: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).label('CBM'),
          NET_WEIGHT: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).label('Net Weight (KG)'),
          GROSS_WEIGHT: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).label('Gross Weight (KG)'),
          FR_PLANT: Joi.string().trim().uppercase().max(12).valid(null, 'ALC', 'LMA').label('From Plant Code'),
          FR_STO_LOC: Joi.string().uppercase().allow(null).label('From warehouse location'),
          FR_BATCH_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').label('From Stock Batch No.'),
          FR_VAL_TYPE: Joi.string().allow(null, '').uppercase().max(100).label('From Valuation Type'),
          FR_STOCK_TYPE: Joi.string().uppercase().valid('UU').label('From Stock Type'),
          TO_PLANT: Joi.string().trim().uppercase().max(12).valid(null, 'ALC', 'LMA').label('From Plant Code'),
          TO_STO_LOC: Joi.string().uppercase().allow(null).label('From warehouse location'),
          TO_BATCH_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').label('From Stock Batch No.'),
          TO_VAL_TYPE: Joi.string().allow(null, '').uppercase().max(100).label('From Valuation Type'),
          TO_STOCK_TYPE: Joi.string().uppercase().valid('UU').label('From Stock Type'),
          SERIAL_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').label('Stock item serial no.'),
          TRD_QTY: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).required().label('Suggested Put Away quantity'),
          FR_LOC: Joi.string().uppercase().max(3).valid('AGV', 'AGF', 'WMS').label('From Location'),
          TO_LOC: Joi.string().uppercase().max(3).valid('AGV', 'AGF', 'WMS').label('To Location'),
          PRIORITY: Joi.number().integer().min(1).default(10).required().label('Priority'),
          MIN_STOCK_LV_AGV: Joi.number().allow(null).label('Minimum Stock Level for AGV'),
          MIN_STOCK_LV_AGF: Joi.number().allow(null).label('Minimum Stock Level for AGF'),
          RACK_TYPE: Joi.string().trim().allow(null, '').max(10).label('Rack Type'),
          SKU_CATEGORY: Joi.string().trim().allow(null, '').max(10).label('SKU Category'),
        }),
      ).min(1).required(),
    }),
  ).min(1).required(),
});

module.exports = {
  CANCEL_SCHEMA,
  CREATE_SCHEMA,
};
