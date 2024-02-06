const Joi = require('joi').extend(require('@joi/date'));

const MAX_LIMIT_DOUBLE = 999999999999;

const CREATE_SCHEMA = Joi.object().keys({
  INTERFACE_NAME: Joi.string().label('Interface name'),
  BATCHID: Joi.string().trim().max(30).required().label('Interface Batch ID'),
  GR_LIST: Joi.array().items(
    Joi.object({
      PA_LIST_NO: Joi.string().trim().max(40).regex(/^[A-Z0-9]{1,37}-[0-9]{1,2}/, 'Format').required().label('Put Away List No.'),
      GR_LIST_ITEM: Joi.array().items(
        Joi.object({
          GR_DATE: Joi.date().format('YYYY/MM/DD').required().label('GR Receiving Date'),
          GR_CODE: Joi.string().trim().max(40).regex(/^[A-Z0-9]{1,40}/, 'Format').required().label('GR Code'),
          GRD_SEQ: Joi.string().trim().max(10).regex(/^[0-9]/, 'Numbers').required().label('GR Detail Sequence No.'),
          GRA_SEQ: Joi.string().trim().max(10).regex(/^[0-9]/, 'Numbers').required().label('GR Put Away Detail Sequence No.'),
          STOCK_NO: Joi.string().trim().max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock No.'),
          PACK_KEY: Joi.string().trim().max(2).regex(/^[0-9]/, 'Numbers').allow(null, '').label('Pack Key'),
          ITM_NAME: Joi.string().max(1000).required().label('Stock name'),
          UOM: Joi.string().uppercase().allow(null, '').max(40).label('Stock item unit of measure'),
          LENGTH: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).allow(null).label('Length (M)'),
          WIDTH: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).allow(null).label('Width (M)'),
          HEIGHT: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).allow(null).label('Height (M)'),
          CBM: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).allow(null).label('CBM'),
          NET_WEIGHT: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).allow(null).label('Net Weight (KG)'),
          GROSS_WEIGHT: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).allow(null).label('Gross Weight (KG)'),
          PLANT: Joi.string().trim().uppercase().max(12).valid(null, 'ALC', 'LMA').allow(null).label('Warehouse Plant Code'),
          STO_LOC: Joi.string().uppercase().allow(null).label('Warehouse storage location'),
          BATCH_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').label('Stock Batch No.'),
          SERIAL_NO: Joi.valid(null, '').label('Stock item serial no.'),
          VAL_TYPE: Joi.string().allow(null, '').uppercase().max(100).label('SAP Valuation Type.'),
          STOCK_TYPE: Joi.string().uppercase().valid(null, 'UU').allow(null).label('Stock Type'),
          EXPIRY_DATE: Joi.date().allow(null, '').format('YYYY/MM/DD').label('Stock item expire date'),
          MANU_DATE: Joi.date().allow(null, '').format('YYYY/MM/DD').label('Stock item manufacture date'),
          SUG_PA_QTY: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).required().label('Suggested Put Away quantity'),
          WES_LOC: Joi.string().uppercase().max(3).valid('AGV', 'AGF').label('WES Put Away Location'),
          PRIORITY: Joi.number().integer().min(1).default(10).required().label('Priority'),
          MIN_STOCK_LV_AGV: Joi.number().allow(null).label('Minimum Stock Level for AGV'),
          MIN_STOCK_LV_AGF: Joi.number().allow(null).label('Minimum Stock Level for AGF'),
          RACK_TYPE: Joi.string().trim().allow(null, '').max(10).label('Rack Type'),
          SKU_CATEGORY: Joi.string().trim().allow(null, '').max(10).label('SKU Category'),
        })
      ).min(1).required(),
    })
  ).min(1).required(),
});

const CANCEL_SCHEMA = Joi.object().keys({
  BATCHID: Joi.string().trim().max(30).required().label('Interface Batch ID'),
  GR_LIST: Joi.array().items(
    Joi.object({
      PA_LIST_NO: Joi.string().trim().max(40).regex(/^[A-Z0-9]{1,37}-[0-9]{1,2}/, 'Format').required().label('Put Away List No.'),
      GR_LIST_ITEM: Joi.array().items(
        Joi.object({
          GR_DATE: Joi.date().format('YYYY/MM/DD').required().label('GR Receiving Date'),
          GR_CODE: Joi.string().trim().max(40).regex(/^[A-Z0-9]{1,40}/, 'Format').required().label('GR Code'),
          GRD_SEQ: Joi.string().trim().max(10).regex(/^[0-9]/, 'Numbers').required().label('GR Detail Sequence No.'),
          GRA_SEQ: Joi.string().trim().max(10).regex(/^[0-9]/, 'Numbers').required().label('GR Put Away Detail Sequence No.'),
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
          SUG_PA_QTY: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).required().label('Suggested Put Away quantity'),
          WES_LOC: Joi.string().uppercase().max(3).valid('AGV', 'AGF').label('WES Put Away Location'),
          CANCEL_FLAG: Joi.string().trim().uppercase().valid('Y').label('Cancel Flag'),
        })
      ).min(1).required(),
    })
  ).min(1).required(),
});

const FORCE_FINISH_SCHEMA = Joi.object().keys({
  order_id: Joi.string().trim().max(20).required().label('Order ID'),
});

module.exports = {
  CREATE_SCHEMA,
  CANCEL_SCHEMA,
  FORCE_FINISH_SCHEMA,
};
