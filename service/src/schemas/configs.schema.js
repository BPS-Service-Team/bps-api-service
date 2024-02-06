const Joi = require('joi');

const DETAIL_SCHEMA = Joi.array().items(
  Joi.object().keys({
    name: Joi.string().max(50).min(1).trim().required().label('Name'),
    type: Joi.string().trim().max(20).valid('text', 'number', 'select', 'color', 'textarea', 'url', 'json').default('text').label('Type'),
    description: Joi.string().max(255).trim().label('Description'),
    slug: Joi.string().max(50).min(1).trim().lowercase().required().label('Short name'),
    value: Joi.any().label('Value'),
    default: Joi.any().label('Default value'),
    sort: Joi.number().integer().default(0).label('Sort'),
    options: Joi.array().items(
      Joi.object().keys({
        value: Joi.any().required().label('Value'),
        label: Joi.string().trim().max(50).lowercase().regex(/[a-z0-9]lbl$/).required().label('Label'),
      })
    ).label('Options'),
  })
);

const POST_SCHEMA = Joi.object().keys({
  name: Joi.string().max(50).min(1).trim().required().label('Name'),
  slug: Joi.string().max(50).min(1).trim().lowercase().required().label('Short name'),
  elements: DETAIL_SCHEMA.label('Elements'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

const PATCH_SCHEMA = Joi.object().keys({
  name: Joi.string().max(50).min(1).trim().allow('').label('Name'),
  slug: Joi.string().max(50).trim().lowercase().label('Short name'),
  elements: DETAIL_SCHEMA.label('Elements'),
  updated_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Updated by'),

  $push: Joi.object().keys({
    elements: DETAIL_SCHEMA.label('Elements'),
  }),

  $pull: Joi.object().keys({
    elements: Joi.object().keys({
      _id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('ID')
    })
  }),

  $set: Joi.any()
});

module.exports = {
  POST_SCHEMA,
  PATCH_SCHEMA,
};
