const Joi = require('joi');

const FIND_SCHEMA = Joi.object().keys({
  type: Joi.string().trim().valid('api', 'pwa', 'cron', 'site').label('Type'),
});

module.exports = {
  FIND_SCHEMA,
};
