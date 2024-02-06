// agv-tasks-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'agv_tasks';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema(
    {
      receipt_code: { type: String },
      order_id: { type: String },
      request: { type: Schema.Types.Mixed },
      direction: { type: String, trim: true, lowercase: true },
      type: { type: String },
      // 1 - Request Created
      // 2 - Finish
      // 3 - Cancel
      status: { type: Number, default: 1 },
      // Flag to run order picking creation when is true
      // This action will be required when a putaway cancellation
      // Is pending by unfinish tasks
      cancel_on_finish: { type: Boolean, default: false },
      retry_count: { type: Number, default: 1 },
      error: [{ type: Schema.Types.Mixed }],

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

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName);
  }
  return mongooseClient.model(modelName, schema);
};
