const Joi = require('joi');

const DETAIL_SCHEMA = Joi.object().keys({
  domain: Joi.string().trim().label('Domain'),
  text: Joi.string().trim().label('Text'),
});

const POST_SCHEMA = Joi.object().keys({
  from: DETAIL_SCHEMA,
  to: DETAIL_SCHEMA,
  type: Joi.string().trim().label('Type'),
  order_id: Joi.string().trim().label('Order ID'),
  command: Joi.string().trim().label('Command'),
  request: Joi.any().label('Payload'),
  reply: Joi.any().label('Result'),
  status: Joi.number().integer().valid(0, 1).label('Status'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

const PATCH_SCHEMA = Joi.object().keys({
  from: DETAIL_SCHEMA,
  to: DETAIL_SCHEMA,
  type: Joi.string().trim().label('Type'),
  order_id: Joi.string().trim().label('Order ID'),
  command: Joi.string().trim().label('Command'),
  request: Joi.any().label('Payload'),
  reply: Joi.any().label('Result'),
  status: Joi.number().integer().valid(0, 1).label('Status'),
  updated_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Updated by'),
});

module.exports = {
  POST_SCHEMA,
  PATCH_SCHEMA
};
