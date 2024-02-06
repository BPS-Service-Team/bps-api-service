// wms-logs-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'wmsLogs';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schemaDetail = new Schema(
    {
      domain: { type: String, trim: true },
      text: { type: String, trim: true },
    },
    {
      _id: false,
    }
  );

  const schema = new Schema(
    {
      from: schemaDetail,
      to: schemaDetail,
      type: { type: String, trim: true },
      order_id: { type: String, trim: true },
      command: { type: String, trim: true },
      request: { type: Schema.Types.Mixed },
      reply: { type: Schema.Types.Mixed },
      // 1 - Send correctly
      // 0 - Something when wrong in the request
      status: { type: Number, default: 1 },

      // Control fields
      created_by: { type: Schema.Types.ObjectId, ref: 'users' },
      updated_by: { type: Schema.Types.ObjectId, ref: 'users' },
    },
    {
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }
  );

  // Expiration for 3 month
  schema.index({ created_at: 1 }, { expireAfterSeconds: 7884000 });

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName);
  }
  return mongooseClient.model(modelName, schema);
};
