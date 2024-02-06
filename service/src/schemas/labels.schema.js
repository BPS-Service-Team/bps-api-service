const Joi = require('joi');

const POST_SCHEMA = Joi.object().keys({
  slug: Joi.string().max(50).min(1).trim().lowercase().regex(/[a-z0-9]lbl$/).required().label('Short name'),
  text: Joi.string().trim().required().label('Text'),
  language: Joi.string().max(2).min(1).trim().default('*').label('Language'),
  country: Joi.string().max(2).min(1).trim().default('*').label('Country'),
  section: Joi.string().lowercase().max(20).min(1).trim().default('general').required().label('Section'),
  type: Joi.string().trim().lowercase().max(10).default('html').valid('html', 'text'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

const PATCH_SCHEMA = Joi.object().keys({
  slug: Joi.string().max(50).trim().lowercase().regex(/[a-z0-9]lbl$/).label('Short name'),
  text: Joi.string().trim().label('Text'),
  language: Joi.string().max(2).trim().label('Language'),
  country: Joi.string().max(2).trim().label('Country'),
  section: Joi.string().lowercase().max(20).trim().label('Section'),
  type: Joi.string().trim().lowercase().max(10).valid('html', 'text'),
  updated_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Updated by'),
});

module.exports = {
  POST_SCHEMA,
  PATCH_SCHEMA
};
