const Joi = require('joi');

const STOCKS_SCHEMA = Joi.array().items(
  Joi.object().keys({
    TASK_NO: Joi.string().trim().max(50).label('Task Number'),
    ORDER_ID: Joi.string().trim().max(20).label('Order ID'),
    STOCK_NO: Joi.string().trim().max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock No.'),
    PACK_KEY: Joi.string().trim().max(2).regex(/^[0-9]/, 'Numbers').allow(null, '').label('Pack Key'),
    ITM_NAME: Joi.string().max(1000).required().label('Stock name'),
    BATCH_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock Batch No.'),
    SERIAL_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock item serial no.'),
    VAL_TYPE: Joi.string().allow(null, '').uppercase().max(100).required().label('SAP Valuation Type.'),
    SHORT_COMING: Joi.boolean().default(false).label('Short Coming'),
    QTY: Joi.number().integer().min(1).required().label('Quantity'),
    DATE: Joi.date().label('Insert Date'),
  })
).single().label('Stocks Items');

const POST_SCHEMA = Joi.object().keys({
  stock_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Stock'),
  user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('User'),
  before: STOCKS_SCHEMA,
  changes: STOCKS_SCHEMA,
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

module.exports = {
  POST_SCHEMA,
};
