// multimedia-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'multimedia';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema(
    {
      user_id: { type: Schema.Types.ObjectId, ref: 'users', ref_name: 'Users', ref_single: 'User', required: true },
      name: { type: String, trim: true, required: true },
      file_name: { type: String, trim: true, unique: true, required: true },
      file_path: { type: String, trim: true, unique: true, required: true },
      file_type: { type: String, trim: true, lowercase: true, required: true },

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

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName);
  }
  return mongooseClient.model(modelName, schema);
};
