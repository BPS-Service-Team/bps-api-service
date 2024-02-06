// users-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'users';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;

  const schema = new Schema(
    {
      // Credentials
      rol_id: { type: Schema.Types.ObjectId, ref: 'roles', ref_name: 'Roles', ref_single: 'Rol', required: true },
      email: { type: String, unique: true, lowercase: true, required: true },
      password: { type: String, trim: true, required: true },
      language: { type: String, trim: true, lowercase: true, max: 3, default: 'en' },

      // Profile data
      full_name: { type: String, trim: true, required: true },
      photo: { type: String, trim: true },
      birthday: { type: Date },
      country: { type: String, trim: true },
      state: { type: String, trim: true },
      city: { type: String, trim: true },
      address: { type: String, trim: true },
      phone: { type: String, trim: true },
      zip_code: { type: String, trim: true },
      status: { type: Number },

      pass_changed: { type: Date },
      pass_expires: { type: Date },
      pass_attempts: { type: Number },
      pass_history: [{ type: String, trim: true }],

      // Tokens
      token: { type: String },
      token_password: { type: String },
      token_expires: { type: Date },

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
