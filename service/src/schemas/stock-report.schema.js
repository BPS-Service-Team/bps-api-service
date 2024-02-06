const Joi = require('joi');

const POST_SCHEMA = Joi.object().keys({
  label: Joi.string().trim().max(10).label('Label'),
  pallet_id: Joi.string().trim().uppercase().max(50).required().label('Pallet ID'),
  stock_no: Joi.string().trim().max(80).regex(/^[0-9/]/, 'Numbers').required().label('Stock No.'),
  pack_key: Joi.string().trim().max(2).regex(/^[0-9]/, 'Numbers').allow(null, '').label('Pack Key'),
  batch_no: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock Batch No.'),
  val_type: Joi.string().allow(null, '').uppercase().max(100).required().label('SAP Valuation Type.'),
  qty: Joi.number().integer().required().label('Amount'),
  remark: Joi.string().trim().max(255).label('Remarks'),
  reason: Joi.string().trim().max(255).label('Reason'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

const PATCH_SCHEMA = Joi.object().keys({
  batch_no: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').label('Stock Batch No.'),
  val_type: Joi.string().allow(null, '').uppercase().max(100).label('SAP Valuation Type.'),
  qty: Joi.number().integer().min(0).label('Quantity'),
  remark: Joi.string().trim().max(255).label('Remarks'),
  reason: Joi.string().trim().max(255).label('Reason'),
  status: Joi.number().integer().valid(201).label('Status'),
  updated_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Updated by'),
});

module.exports = {
  POST_SCHEMA,
  PATCH_SCHEMA,
};
