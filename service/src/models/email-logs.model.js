// email-logs-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'email_logs';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema(
    {
      message_id: { type: String, max: 255, trim: true },
      reference_id: { type: String, trim: true },
      reference_type: { type: String, max: 50, trim: true, lowercase: true },
      from: { type: String, max: 50, trim: true },
      to: { type: String, max: 255, trim: true },
      subject: { type: String, max: 50, trim: true },
      result: { type: Schema.Types.Mixed },
      status: { type: Number, default: 1 },

      // Control fields
      created_by: { type: Schema.Types.ObjectId, ref: 'users' },
      updated_by: { type: Schema.Types.ObjectId, ref: 'users' },
    },
    {
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
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
