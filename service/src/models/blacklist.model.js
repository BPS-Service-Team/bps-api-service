const ms = require('ms');

// blacklist-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'blacklist';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema(
    {
      token: { type: String, required: true },
      date: { type: Date, required: true },
      expire_in: { type: Date, required: true },
    },
    {
      timestamps: false,
    }
  );

  const { jwtOptions } = app.get('authentication');

  // Default 1 month
  let iExpire = 2592000;
  if (jwtOptions) {
    if (jwtOptions.expiresIn) {
      iExpire = ms(jwtOptions.expiresIn) / 1000;
    }
  }

  schema.index({ date: 1 }, { expireAfterSeconds: iExpire });

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName);
  }
  return mongooseClient.model(modelName, schema);
};
