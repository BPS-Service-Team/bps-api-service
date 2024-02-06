const Joi = require('joi');

const POST_SCHEMA = Joi.object().keys({
  label: Joi.string().trim().max(10).required().label('Label'),
  workstation_id: Joi.string().trim().max(10).label('Workstation ID'),
  staging_id: Joi.number().integer().label('Staging ID'),
  cmd: Joi.string().trim().max(10).required().label('Command'),
  r: Joi.number().integer().default(0).label('R'),
  c: Joi.number().integer().default(0).label('C'),
  lv: Joi.number().integer().default(0).label('Level'),
  type: Joi.number().integer().valid(1, 2, 3, 4).required().label('Type'),
  x: Joi.number().integer().required().label('X Position'),
  y: Joi.number().integer().required().label('Y Position'),
  status: Joi.number().integer().valid(1, 2, 3, 4, 5).default(1).label('Status'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

const PATCH_SCHEMA = Joi.object().keys({
  label: Joi.string().trim().max(10).label('Label'),
  workstation_id: Joi.string().trim().max(10).label('Workstation ID'),
  staging_id: Joi.number().integer().label('Staging ID'),
  cmd: Joi.string().trim().max(10).label('Command'),
  r: Joi.number().integer().label('R'),
  c: Joi.number().integer().label('C'),
  lv: Joi.number().integer().label('Level'),
  type: Joi.number().integer().label('Type'),
  x: Joi.number().integer().label('X Position'),
  y: Joi.number().integer().label('Y Position'),
  order_id: Joi.string().trim().max(20).label('Order ID'),
  pallet_id: Joi.string().trim().max(50).allow('').label('Pallet ID'),
  status: Joi.number().integer().valid(1, 2, 3, 4, 5).label('Status'),
  updated_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Updated by'),
});

module.exports = {
  POST_SCHEMA,
  PATCH_SCHEMA,
};
