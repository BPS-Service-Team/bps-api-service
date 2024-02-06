const Joi = require('joi');

const MAX_LIMIT_DOUBLE = 999999999999;

const POST_SCHEMA = Joi.object().keys({
  stock_no: Joi.string().trim().max(80).regex(/^[0-9/]/, 'Numbers').required().label('Stock No.'),
  cbm: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).label('CBM'),
  gross_weight: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).label('Gross Weight (KG)'),
  height: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).label('Height (M)'),
  itm_name: Joi.string().max(1000).required().label('Stock name'),
  length: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).label('Length (M)'),
  long_desc: Joi.string().trim().label('Long description'),
  min_stk_lv: Joi.number().allow('', null).label('Min stock level'),
  min_stock_lv_agf: Joi.number().allow('', null).label('Minimum Stock Level for AGF'),
  min_stock_lv_agv: Joi.number().allow('', null).label('Minimum Stock Level for AGV'),
  net_weight: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).label('Net Weight (KG)'),
  plant: Joi.string().trim().uppercase().max(12).valid(null, 'ALC').allow(null).label('Warehouse Plant Code'),
  stock_type: Joi.string().uppercase().valid(null, 'UU').allow(null).label('Stock Type'),
  uom: Joi.string().uppercase().allow(null, '').max(40).label('Stock item unit of measure'),
  width: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).label('Width (M)'),
  status: Joi.number().integer().valid(0, 1).default(1).label('Status'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

const PATCH_SCHEMA = Joi.object().keys({
  stock_no: Joi.string().trim().max(80).regex(/^[0-9/]/, 'Numbers').label('Stock No.'),
  cbm: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).label('CBM'),
  gross_weight: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).label('Gross Weight (KG)'),
  height: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).label('Height (M)'),
  itm_name: Joi.string().max(1000).label('Stock name'),
  length: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).label('Length (M)'),
  long_desc: Joi.string().trim().label('Long description'),
  min_stk_lv: Joi.number().allow('', null).label('Min stock level'),
  min_stock_lv_agf: Joi.number().allow('', null).label('Minimum Stock Level for AGF'),
  min_stock_lv_agv: Joi.number().allow('', null).label('Minimum Stock Level for AGV'),
  net_weight: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).label('Net Weight (KG)'),
  plant: Joi.string().trim().uppercase().max(12).valid(null, 'ALC').allow(null).label('Warehouse Plant Code'),
  stock_type: Joi.string().uppercase().valid(null, 'UU').allow(null).label('Stock Type'),
  uom: Joi.string().uppercase().allow(null, '').max(40).label('Stock item unit of measure'),
  width: Joi.number().max(MAX_LIMIT_DOUBLE).precision(2).label('Width (M)'),
  status: Joi.number().integer().valid(0, 1).label('Status'),
  updated_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Updated by'),
});

const VALIDATE_QR_CODE = Joi.object().keys({
  order_id: Joi.string().trim().max(20).required().label('Order ID'),
  code: Joi.string().trim().regex(/[0-9]{1,80};1;[A-Z]{1,100};[0-9]{0,80};[0-9]{0,80}/, 'STOCK_NO;1;VAL_TYPE;SERIAL_NO?;BATCH_NO?').required().label('QR Code'),
});

module.exports = {
  POST_SCHEMA,
  PATCH_SCHEMA,
  VALIDATE_QR_CODE,
};
