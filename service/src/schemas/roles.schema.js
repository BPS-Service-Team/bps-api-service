const Joi = require('joi');

const POST_SCHEMA = Joi.object().keys({
  group: Joi.string().max(20).min(1).lowercase().trim().required().label('Group'),
  name: Joi.string().max(50).min(1).trim().required().label('Name'),
  description: Joi.string().empty().label('Description'),
  home: Joi.string().max(255).min(1).default('/').empty().label('Home'),
  status: Joi.number().integer().valid(0, 1).default(1).required().label('Status'),

  permissions: Joi.array().items(
    Joi.object().keys({
      actions: Joi.array().items(Joi.string().max(20).min(1)).required().label('Actions'),
      subject: Joi.array().items(Joi.string().max(100).min(1)).required().label('Subject'),
      conditions: Joi.object().empty().label('Conditions'),
    })
  ),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

const PATCH_SCHEMA = Joi.object().keys({
  group: Joi.string().max(20).lowercase().trim().label('Group'),
  name: Joi.string().max(50).trim().label('Name'),
  description: Joi.string().empty().label('Description'),
  home: Joi.string().max(255).default('/').empty().label('Home'),
  status: Joi.number().integer().valid(0, 1).default(1).label('Status'),

  permissions: Joi.array().items(
    Joi.object().keys({
      actions: Joi.array().items(Joi.string().max(20).min(1)).required().label('Actions'),
      subject: Joi.array().items(Joi.string().max(100).min(1)).required().label('Subject'),
      conditions: Joi.object().empty().label('Conditions'),
    })
  ),
  updated_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Updated by'),
});

module.exports = {
  POST_SCHEMA,
  PATCH_SCHEMA
};
