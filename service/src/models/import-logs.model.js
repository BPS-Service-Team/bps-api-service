// import-logs-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'import_logs';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema(
    {
      type: { type: String, trim: true, required: true },
      failure: { type: Number, default: 0 },
      inserted: { type: Number, default: 0 },
      log: [Schema.Types.Mixed],
      total: { type: Number, default: 0 },
      updated: { type: Number, default: 0 },
      // 0 - In process, 1 - Finish
      status: { type: Number, default: 0 },

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

  // Expiration for 2 month
  schema.index({ created_at: 1 }, { expireAfterSeconds: 5184000 });

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName);
  }
  return mongooseClient.model(modelName, schema);
};
