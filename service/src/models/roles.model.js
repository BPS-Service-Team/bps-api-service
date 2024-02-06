// roles-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'roles';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;

  const permissionSchema = new Schema(
    {
      actions: [String],
      subject: [String],
      conditions: { type: Map, of: String },
    },
    {
      _id: false,
    }
  );

  const schema = new Schema(
    {
      group: { type: String, max: 20, unique: true, lowercase: true, trim: true, required: true },
      name: { type: String, max: 50, trim: true, required: true },
      home: { type: String, max: 255, default: '/' },
      status: { type: Number, default: 1 },
      // Permissions per rol
      permissions: [permissionSchema],

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
