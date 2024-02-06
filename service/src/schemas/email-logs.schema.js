const Joi = require('joi');

const POST_SCHEMA = Joi.object().keys({
  message_id: Joi.string().trim().label('Message'),
  reference_id: Joi.string().label('Reference'),
  reference_type: Joi.string().trim().lowercase().required().label('Reference type'),
  from: Joi.string().trim().required().label('From'),
  to: Joi.string().trim().label('To'),
  subject: Joi.string().trim().label('Subject'),
  result: Joi.any().label('Result'),
  status: Joi.number().integer().valid(0, 1).default(1).required().label('Status'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

const PATCH_SCHEMA = Joi.object().keys({
  message_id: Joi.string().trim().label('Message'),
  reference_id: Joi.string().label('Reference'),
  reference_type: Joi.string().trim().lowercase().label('Reference type'),
  from: Joi.string().trim().label('From'),
  to: Joi.string().trim().label('To'),
  subject: Joi.string().trim().label('Subject'),
  result: Joi.any().label('Result'),
  status: Joi.number().integer().valid(0, 1).label('Status'),
  updated_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Updated by'),
});

module.exports = {
  POST_SCHEMA,
  PATCH_SCHEMA,
};
