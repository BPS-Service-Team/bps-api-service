const Joi = require('joi');

const POST_SCHEMA = Joi.object().keys({
  order_id: Joi.string().trim().max(20).required().label('Order ID'),
  pallet_id: Joi.string().trim().uppercase().max(255).required().label('Pallet ID'),
  operation: Joi.string().trim().lowercase().max(10).valid('reserve', 'release', 'picking').label('Operation'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

module.exports = {
  POST_SCHEMA,
};
