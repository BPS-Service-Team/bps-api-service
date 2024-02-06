// agf-tasks-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'agf_tasks';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema(
    {
      agf_id: { type: Schema.Types.ObjectId, ref: 'agfs' },
      order_id: { type: String },
      direction: { type: String, trim: true },
      task_no: { type: String },
      task_type: { type: String },
      location_source: { type: String },
      location_destination: { type: String },
      priority: { type: Number },
      pallet_type: { type: String },
      request: { type: Schema.Types.Mixed },
      check: { type: Boolean, default: false },
      check_result: new Schema(
        {
          height: { type: Number, default: 2 },
          width: { type: Number, default: 2 },
        },
        {
          _id: false,
        }
      ),
      check_error: { type: Boolean, default: false },
      retry_count: { type: Number, default: 1 },
      error: [{ type: Schema.Types.Mixed }],
      // Flag to run order picking creation when is true
      // This action will be required when a putaway cancellation
      // Is pending by unfinish tasks
      cancel_on_finish: { type: Boolean, default: false },
      // 1 - Request Created
      // 2 - Start
      // 3 - Check
      // 4 - Finish
      // 5 - Cancel
      // 6 - Error
      // 7 - Soft delete
      status: { type: Number, default: 1 },

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
