const Joi = require('joi');

const POST_SCHEMA = Joi.object().keys({
  command: Joi.string().trim().label('Command'),
  order_id: Joi.string().trim().label('Order ID'),
  task_id: Joi.string().trim().label('Task No'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

module.exports = {
  POST_SCHEMA,
};
