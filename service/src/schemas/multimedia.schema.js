const Joi = require('joi');

const POST_SCHEMA = Joi.array().items(
  Joi.object().keys({
    user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().label('User'),
    name: Joi.string().trim().required().label('Name'),
    file_name: Joi.string().trim().required().label('File name'),
    file_path: Joi.string().trim().required().label('File path'),
    real_file_path: Joi.string().trim().label('Real file path'),
    file_type: Joi.string().trim().required().label('File type'),
    created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
  })
).single();

module.exports = {
  POST_SCHEMA,
};
