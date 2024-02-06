const Joi = require('joi');

const DETAILS_SCHEMA = Joi.object().keys({
  type: Joi.string().trim().max(20).valid('putaway', 'picking', 'custom').required().label('Type'),
  status: Joi.number().integer().valid(0, 1, 2).label('Status'),
  from: Joi.string().trim().max(20).required().label('From'),
  to: Joi.string().trim().max(20).required().label('To'),
  seq: Joi.number().integer().min(1).required().label('Seq Number'),
  payload: Joi.any(),
});

const POST_SCHEMA = Joi.object().keys({
  order_id: Joi.string().trim().max(20).required().label('Order ID'),
  interface_name: Joi.string().label('Interface name'),
  batch_id: Joi.string().trim().max(30).required().label('Interface Batch ID'),
  type: Joi.string().trim().max(10).valid('picking', 'putaway', 'return', 'relocation').required().label('Type'),
  status: Joi.number().integer().valid(1, 2, 3, 4, 5, 6).default(1).label('Status'),
  agv_status: Joi.number().integer().valid(-1, 0, 1, 2, 3, 4, 5).label('AGV Status'),
  agf_status: Joi.number().integer().valid(-1, 0, 1, 2, 3, 4, 5).label('AGF Status'),
  agv: Joi.array().items(Joi.any()).label('AGV Lines'),
  agf: Joi.array().items(Joi.any()).label('AGF Lines'),
  details: Joi.array().items(DETAILS_SCHEMA),
  relocation: Joi.string().trim().max(20).label('Relocation ID'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

const PATCH_SCHEMA = Joi.object().keys({
  status: Joi.number().integer().valid(1, 2, 3, 4, 5, 6).label('Status'),
  cancelled: Joi.boolean().label('Cancelled'),
  cancel_on_finish: Joi.boolean().label('Cancel on Finish'),
  agv: Joi.array().items(Joi.any()).label('AGV Lines'),
  agf: Joi.array().items(Joi.any()).label('AGF Lines'),
  agv_pallets: Joi.array().items(Joi.string().trim()).label('AGV Pallets'),
  agf_pallets: Joi.array().items(Joi.string().trim()).label('AGF Pallets'),
  agv_status: Joi.number().integer().valid(-1, 0, 1, 2, 3, 4, 5).label('AGV Status'),
  agf_status: Joi.number().integer().valid(-1, 0, 1, 2, 3, 4, 5).label('AGF Status'),
  start_time: Joi.date().label('Start Time'),
  complete_time: Joi.date().label('Complete Time'),
  details: Joi.array().items(DETAILS_SCHEMA),
  relocation: Joi.string().trim().max(20).label('Relocation ID'),
  pending_feedback: Joi.boolean().label('Pending WMS feed'),
  calculate: Joi.any().label('Calculate Data'),
  updated_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Updated by'),
});

module.exports = {
  POST_SCHEMA,
  PATCH_SCHEMA
};
