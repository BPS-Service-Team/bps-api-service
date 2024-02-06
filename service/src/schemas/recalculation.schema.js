const Joi = require('joi');

const POST_SCHEMA = Joi.object().keys({
  label: Joi.string().trim().max(10).required().label('Label'),
  workstation_id: Joi.string().trim().max(10).required().label('Workstation ID'),
  stocks: Joi.array().items(
    Joi.object().keys({
      _id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().label('ID'),
      batch_no: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock Batch No.'),
      itm_name: Joi.string().max(1000).required().label('Stock name'),
      pack_key: Joi.string().trim().max(2).regex(/^[0-9]/, 'Numbers').allow(null, '').label('Pack Key'),
      qty: Joi.number().integer().required().label('Amount'),
      stock_no: Joi.string().trim().max(80).regex(/^[0-9/]/, 'Numbers').required().label('Stock No.'),
      val_type: Joi.string().allow(null, '').uppercase().max(100).required().label('SAP Valuation Type.'),
    })
  ),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

module.exports = {
  POST_SCHEMA,
};
