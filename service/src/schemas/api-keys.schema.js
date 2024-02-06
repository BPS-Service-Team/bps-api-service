const Joi = require('joi');

const POST_SCHEMA = Joi.object().keys({
  user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().label('User'),
  rol_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Rol'),
  project_name: Joi.string().max(100).trim().required().label('Project name'),
  status: Joi.number().integer().default(0).valid(0, 1).label('Status'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

const PATCH_SCHEMA = Joi.object().keys({
  user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('User'),
  rol_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Rol'),
  project_name: Joi.string().max(100).trim().label('Project name'),
  api_key: Joi.string().max(255).trim().label('Key'),
  status: Joi.number().integer().valid(0, 1).label('Status'),
  updated_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Updated by'),
});

module.exports = {
  POST_SCHEMA,
  PATCH_SCHEMA,
};
