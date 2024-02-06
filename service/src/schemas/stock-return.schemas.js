const Joi = require('joi').extend(require('@joi/date'));

const MAX_LIMIT_DOUBLE = 999999999999;

const CREATE_SCHEMA = Joi.object().keys({
  BATCHID: Joi.string().trim().max(30).required().label('Interface Batch ID'),
  SR_LIST: Joi.array().items(
    Joi.object().keys({
      SR_LIST_NO: Joi.string().trim().max(40).regex(/^[A-Z0-9]{1,37}-[0-9]{1,2}/, 'Format').required().label('Stock Return List No.'),
      SR_LIST_ITEM: Joi.array().items(
        Joi.object().keys({
          ITM_NAME: Joi.string().max(1000).required().label('Stock item name'),
          PACK_KEY: Joi.string().trim().max(2).regex(/^[0-9]/, 'Numbers').allow(null, '').label('Pack Key'),
          RACK_TYPE: Joi.string().trim().allow(null, '').max(10).label('Rack Type'),
          SERIAL_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').label('Stock item serial no.'),
          STOCK_NO: Joi.string().trim().max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock No.'),
          BATCH_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').label('Stock Batch No.'),
          VAL_TYPE: Joi.string().allow(null, '').uppercase().max(100).label('SAP Valuation Type.'),
          CBM: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).allow(null).label('CBM'),
          EXPIRY_DATE: Joi.date().allow(null, '').format('YYYY/MM/DD').label('Stock item expire date'),
          GROSS_WEIGHT: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).allow(null).label('Gross Weight (KG)'),
          HEIGHT: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).allow(null).label('Height (M)'),
          LENGTH: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).allow(null).label('Length (M)'),
          MANU_DATE: Joi.date().allow(null, '').format('YYYY/MM/DD').label('Stock item manufacture date'),
          MIN_STOCK_LV_AGF: Joi.number().allow(null).label('Minimum Stock Level for AGF'),
          MIN_STOCK_LV_AGV: Joi.number().allow(null).label('Minimum Stock Level for AGV'),
          NET_WEIGHT: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).allow(null).label('Net Weight (KG)'),
          PLANT: Joi.string().trim().uppercase().max(12).valid(null, 'ALC').allow(null).label('Warehouse Plant Code'),
          PRIORITY: Joi.number().integer().min(1).default(10).required().label('Priority'),
          RTD_SEQ: Joi.string().trim().max(10).regex(/^[0-9]/, 'Numbers').required().label('SR Detail Sequence No.'),
          RT_CODE: Joi.string().trim().max(40).regex(/^[A-Z0-9]{1,40}/, 'Format').required().label('SR Code'),
          RT_DATE: Joi.date().format('YYYY/MM/DD').required().label('SR creation Date'),
          SKU_CATEGORY: Joi.string().trim().allow(null, '').max(10).label('SKU Category'),
          STOCK_TYPE: Joi.string().uppercase().valid(null, 'UU').allow(null).label('Stock Type'),
          STO_LOC: Joi.string().uppercase().valid(null, '1100', '110R', '110S', '110T', '110U', '110Z').allow(null).label('Warehouse storage location'),
          SUG_PA_QTY: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).required().label('Suggested Put Away quantity'),
          UOM: Joi.string().uppercase().allow(null, '').max(40).label('Stock item unit of measure'),
          WES_LOC: Joi.string().uppercase().max(3).valid('AGV', 'AGF').label('WES Put Away Location'),
          WIDTH: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).allow(null).label('Width (M)'),
        }),
      ).min(1).required(),
    }),
  ).min(1).required(),
});

const CANCEL_SCHEMA = Joi.object().keys({
  BATCHID: Joi.string().trim().max(30).required().label('Interface Batch ID'),
  SR_LIST: Joi.array().items(
    Joi.object().keys({
      SR_LIST_NO: Joi.string().trim().max(40).regex(/^[A-Z0-9]{1,37}-[0-9]{1,2}/, 'Format').required().label('Stock Return List No.'),
      SR_LIST_ITEM: Joi.array().items(
        Joi.object().keys({
          ITM_NAME: Joi.string().max(1000).required().label('Stock item name'),
          SERIAL_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').label('Stock item serial no.'),
          STOCK_NO: Joi.string().trim().max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock No.'),
          BATCH_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').label('Stock Batch No.'),
          VAL_TYPE: Joi.string().allow(null, '').uppercase().max(100).label('SAP Valuation Type.'),
          PACK_KEY: Joi.string().trim().max(2).regex(/^[0-9]/, 'Numbers').allow(null, '').label('Pack Key'),
          CANCEL_YN: Joi.string().trim().uppercase().valid('Y', 'N').label('Cancelation flag'),
          EXPIRY_DATE: Joi.date().allow(null, '').format('YYYY/MM/DD').label('Stock item expire date'),
          MANU_DATE: Joi.date().allow(null, '').format('YYYY/MM/DD').label('Stock item manufacture date'),
          MIN_STOCK_LV_AGF: Joi.number().allow(null).label('Minimum Stock Level for AGF'),
          MIN_STOCK_LV_AGV: Joi.number().allow(null).label('Minimum Stock Level for AGV'),
          PLANT: Joi.string().trim().uppercase().max(12).valid(null, 'ALC').allow(null).label('Warehouse Plant Code'),
          RACK_TYPE: Joi.string().trim().allow(null, '').max(10).label('Rack Type'),
          RTD_SEQ: Joi.string().trim().max(10).regex(/^[0-9]/, 'Numbers').required().label('SR Detail Sequence No.'),
          RT_CODE: Joi.string().trim().max(40).regex(/^[A-Z0-9]{1,40}/, 'Format').required().label('SR Code'),
          RT_DATE: Joi.date().format('YYYY/MM/DD').required().label('SR creation Date'),
          SKU_CATEGORY: Joi.string().trim().allow(null, '').max(10).label('SKU Category'),
          STOCK_TYPE: Joi.string().uppercase().valid(null, 'UU').allow(null).label('Stock Type'),
          STO_LOC: Joi.string().uppercase().valid(null, '1100', '110R', '110S', '110T', '110U', '110Z').allow(null).label('Warehouse storage location'),
          SUG_PA_QTY: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).required().label('Suggested Put Away quantity'),
          UOM: Joi.string().uppercase().allow(null, '').max(40).label('Stock item unit of measure'),
          WES_LOC: Joi.string().uppercase().max(3).valid('AGV', 'AGF').label('WES Put Away Location'),
        }),
      ).min(1).required(),
    }),
  ).min(1).required(),
});

module.exports = {
  CANCEL_SCHEMA,
  CREATE_SCHEMA,
};
