const joiOptions = require('../../utils/joi.options').options();

exports.getCustomOptions = () => {
  joiOptions.messages = {
    'any.required': '{{#label}} not found',
  };

  return joiOptions;
};
