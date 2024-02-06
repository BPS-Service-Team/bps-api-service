const Joi = require('joi').extend(require('@joi/date'));

const POST_SCHEMA = Joi.object().keys({
  order_id: Joi.string().trim().max(20).required().label('Order ID'),
  items: Joi.array().items(
    Joi.object({
      STOCK_NO: Joi.string().trim().max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock No.'),
      ITM_NAME: Joi.string().max(1000).required().label('Stock name'),
      BATCH_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock Batch No.'),
      PACK_KEY: Joi.string().trim().max(2).regex(/^[0-9]/, 'Numbers').allow(null, '').label('Pack Key'),
      SERIAL_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock item serial no.'),
      VAL_TYPE: Joi.string().allow(null, '').uppercase().max(100).required().label('SAP Valuation Type.'),
      DATE: Joi.date().label('Insert Date'),
    })
  ).min(1).required().label('Item List'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

module.exports = {
  POST_SCHEMA,
};
