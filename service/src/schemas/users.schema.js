const Joi = require('joi');

const POST_SCHEMA = Joi.object().keys({
  rol_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().label('Rol'),
  push_id: Joi.string().trim().max(255).allow(null).label('Push Id'),
  email: Joi.string().lowercase().email({ minDomainSegments: 2 }).trim().required().label('Email'),
  password: Joi.string().regex(/(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?=.*[!@#$%^&*;]+)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/).message({
    'string.pattern.base': [
      'Contain at least 1 upper case letter',
      'Contain at least 1 lower case letter',
      'Contain at least 1 number',
      'Contain at least 1 special characters !@#$%^&*;',
      'Contain at least 8 characters in length',
      'Password maximum length should not be arbitrarily limited',
    ].join('\n'),
  }).required().label('Password'),
  rpassword: Joi.string().required().label('Repeat password'),
  language: Joi.string().trim().lowercase().max(3).default('en').label('Language'),
  full_name: Joi.string().max(255).trim().required().label('Full name'),
  photo: Joi.string().trim().label('Photo'),
  birthday: Joi.date().label('Birthday'),
  country: Joi.string().trim().default('MX').label('Country'),
  state: Joi.string().trim().max(3).min(3).label('State'),
  city: Joi.string().trim().max(100).trim().label('City'),
  address: Joi.string().max(255).label('Address'),
  phone: Joi.string().max(50).trim().label('Phone'),
  zip_code: Joi.string().max(10).trim().label('Zip code'),
  status: Joi.number().integer().valid(0, 1).default(0).label('Status'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

const PATCH_SCHEMA = Joi.object().keys({
  rol_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Rol'),
  push_id: Joi.string().trim().max(255).allow(null).label('Push Id'),
  email: Joi.string().lowercase().email({ minDomainSegments: 2 }).trim().label('Email'),
  password: Joi.string().regex(/^[a-zA-Z0-9!@#$%=;]{5,30}$/).message({
    'string.pattern.base': [
      'Contain at least 1 upper case letter',
      'Contain at least 1 lower case letter',
      'Contain at least 1 number',
      'Contain at least 1 special characters !@#$%^&*;',
      'Contain at least 8 characters in length',
      'Password maximum length should not be arbitrarily limited',
    ].join('\n'),
  }).label('Password'),
  rpassword: Joi.string().label('Repeat password'),
  language: Joi.string().trim().lowercase().max(3).label('Language'),
  full_name: Joi.string().max(255).trim().label('Full name'),
  photo: Joi.string().trim().label('Photo'),
  birthday: Joi.date().label('Birthday'),
  country: Joi.string().trim().label('Country'),
  state: Joi.string().trim().max(3).min(3).label('State'),
  city: Joi.string().trim().max(100).trim().label('City'),
  address: Joi.string().max(255).label('Address'),
  phone: Joi.string().max(50).trim().label('Phone'),
  zip_code: Joi.string().max(10).trim().label('Zip code'),
  status: Joi.number().integer().valid(0, 1, 2).label('Status'),

  pass_attempts: Joi.number().integer().label('Password attempts'),

  // Tokens
  token: Joi.string().allow('').label('Token'),
  token_password: Joi.string().allow('').label('Token password'),
  token_expires: Joi.date().label('Token expire'),
  updated_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Updated by'),
});

module.exports = {
  POST_SCHEMA,
  PATCH_SCHEMA
};
