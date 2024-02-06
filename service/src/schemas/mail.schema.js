const Joi = require('joi');

const POST_SCHEMA = Joi.object().keys({
  content: Joi.string().trim().label('Content'),
  title: Joi.string().trim().label('Title'),
  email: Joi.any().label('Email'),
  reference_id: Joi.string().trim().label('Reference'),
  reference_type: Joi.string().trim().label('Reference type'),
  extra_data: Joi.any(),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

module.exports = {
  POST_SCHEMA,
};
