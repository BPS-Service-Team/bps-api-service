const Joi = require('joi');

const STOCKS_SCHEMA = Joi.array().items(
  Joi.object().keys({
    TASK_NO: Joi.string().trim().max(50).label('Task Number'),
    ORDER_ID: Joi.string().trim().max(20).label('Order ID'),
    STOCK_NO: Joi.string().trim().max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock No.'),
    PACK_KEY: Joi.string().trim().max(2).regex(/^[0-9]/, 'Numbers').allow(null, '').label('Pack Key'),
    ITM_NAME: Joi.string().max(1000).required().label('Stock name'),
    BATCH_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock Batch No.'),
    SERIAL_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').label('Stock item serial no.'),
    VAL_TYPE: Joi.string().allow(null, '').uppercase().max(100).label('SAP Valuation Type.'),
    SHORT_COMING: Joi.boolean().default(false).label('Short Coming'),
    QTY: Joi.number().integer().min(1).required().label('Quantity'),
    DATE: Joi.date().label('Insert Date'),
  })
).single().label('Stocks Items');

const POST_SCHEMA = Joi.object().keys({
  label: Joi.string().trim().max(10).required().label('Label'),
  cmd: Joi.string().trim().max(10).required().label('Command'),
  type: Joi.string().trim().max(10).valid('Short', 'Long').required().label('Type'),
  aisle: Joi.string().trim().max(10).required().label('Aisle'),
  position: Joi.string().trim().max(10).required().label('Position'),
  level: Joi.number().integer().required().label('Level'),
  status: Joi.number().integer().valid(200, 201, 202, 203, 204).default(200).label('Status'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created by'),
});

const PATCH_SCHEMA = Joi.object().keys({
  stocks: STOCKS_SCHEMA,
  pallet_id: Joi.string().trim().max(50).allow('').label('Pallet ID'),
  label: Joi.string().trim().max(10).label('Label'),
  cmd: Joi.string().trim().max(10).label('Command'),
  type: Joi.string().trim().max(10).valid('Short', 'Long').label('Type'),
  aisle: Joi.string().trim().max(10).label('Aisle'),
  position: Joi.string().trim().max(10).label('Position'),
  level: Joi.number().integer().label('Level'),
  status: Joi.number().integer().valid(200, 201, 202, 203, 204).label('Status'),
  updated_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Updated by'),

  $push: Joi.object().keys({
    stocks: STOCKS_SCHEMA,
  }),

  $pull: Joi.object().keys({
    stocks: Joi.object().keys({
      _id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('ID')
    })
  }),

  $set: Joi.any()
});

module.exports = {
  POST_SCHEMA,
  PATCH_SCHEMA,
};
