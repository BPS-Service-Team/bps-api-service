const Joi = require('joi');

const POST_SCHEMA = Joi.object().keys({
  email: Joi.string().lowercase().email({ minDomainSegments: 2 }).trim().required().label('Email'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

const PATCH_SCHEMA = Joi.object().keys({
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
  updated_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Updated by'),
});

module.exports = {
  POST_SCHEMA,
  PATCH_SCHEMA,
};
