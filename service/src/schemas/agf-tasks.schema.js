const Joi = require('joi');

const CHECK_SCHEMA = Joi.object().keys({
  height: Joi.number().integer().valid(0, 1, 2).default(2).label('Check Width Result'),
  width: Joi.number().integer().valid(0, 1, 2).default(2).label('Check Width Result'),
}).label('Check Results');

const POST_SCHEMA = Joi.object().keys({
  agf_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('AGF ID'),
  order_id: Joi.string().trim().max(20).required().label('Order ID'),
  direction: Joi.string().trim().max(20).valid('in', 'out').default('in').label('Direction'),
  task_no: Joi.string().trim().max(36).required().label('Task No'),
  task_type: Joi.string().trim().max(36).required().label('Task Type'),
  location_source: Joi.string().trim().max(16).required().label('Location Source'),
  location_destination: Joi.string().trim().max(16).required().label('Location Destination'),
  priority: Joi.number().allow('', null).label('Priority'),
  pallet_type: Joi.string().max(4).required().label('Pallet Type'),
  request: Joi.any(),
  check: Joi.boolean().default(false).label('Check Height / Width'),
  check_error: Joi.boolean().label('Check error'),
  error: Joi.array().items(Joi.any()).label('Error'),
  retry_count: Joi.number().default(1).label('Retry count'),
  cancel_on_finish: Joi.boolean().default(false).label('Cancel on Finish'),
  status: Joi.number().integer().valid(1, 2, 3, 4, 5, 6).default(1).label('Status'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created By'),
});

const PATCH_SCHEMA = Joi.object().keys({
  agf_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('AGF ID'),
  order_id: Joi.string().trim().max(20).label('Order ID'),
  direction: Joi.string().trim().max(20).valid('in', 'out').label('Direction'),
  task_no: Joi.string().trim().max(36).label('Task No'),
  task_type: Joi.string().trim().max(36).label('Task Type'),
  location_source: Joi.string().trim().max(16).label('Location Source'),
  location_destination: Joi.string().trim().max(16).label('Location Destination'),
  priority: Joi.number().allow('', null).label('Priority'),
  pallet_type: Joi.string().max(4).label('Pallet Type'),
  request: Joi.any(),
  check_result: CHECK_SCHEMA,
  check_error: Joi.boolean().label('Check error'),
  error: Joi.array().items(Joi.any()).label('Error'),
  retry_count: Joi.number().label('Retry count'),
  cancel_on_finish: Joi.boolean().label('Cancel on Finish'),
  status: Joi.number().integer().valid(1, 2, 3, 4, 5, 6, 7).label('Status'),
  updated_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created By'),

  $push: Joi.object().keys({
    error: Joi.array().items(Joi.any()).label('Error'),
  }),

  $pull: Joi.object().keys({
    error: Joi.object().keys({
      _id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('ID')
    })
  }),

  $set: Joi.any()
});

module.exports = {
  PATCH_SCHEMA,
  POST_SCHEMA,
};
