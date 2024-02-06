const Joi = require('joi');

const POST_SCHEMA = Joi.object().keys({
  receipt_code: Joi.string().trim().max(32).required().label('Goods Receipt Code'),
  order_id: Joi.string().trim().max(20).label('Order ID'),
  request: Joi.any(),
  retry_count: Joi.number().label('Retry count'),
  direction: Joi.string().trim().lowercase().valid('in', 'out').default('in').label('Direction'),
  type: Joi.string().valid('create').required().label('Type'),
  status: Joi.number().integer().valid(0, 1, 2, 3, 4).default(1).label('Status'),
  cancel_on_finish: Joi.boolean().default(false).label('Cancel on Finish'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created By'),
});

const PATCH_SCHEMA = Joi.object().keys({
  receipt_code: Joi.string().trim().max(32).label('Goods Receipt Code'),
  order_id: Joi.string().trim().max(20).label('Order ID'),
  request: Joi.any(),
  retry_count: Joi.number().label('Retry count'),
  direction: Joi.string().trim().lowercase().valid('in', 'out').label('Direction'),
  type: Joi.string().valid('create').label('Type'),
  status: Joi.number().integer().valid(0, 1, 2, 3, 4).label('Status'),
  cancel_on_finish: Joi.boolean().label('Cancel on Finish'),
  updated_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created By'),
});

module.exports = {
  PATCH_SCHEMA,
  POST_SCHEMA,
};
