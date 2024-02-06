// labels-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'labels';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema(
    {
      slug: { type: String, max: 50, trim: true, lowercase: true, required: true },
      text: { type: String, trim: true, required: true },
      language: { type: String, max: 2, trim: true, required: true },
      country: { type: String, max: 2, trim: true, required: true },
      section: { type: String, max: 20, trim: true, lowercase: true, required: true },
      type: { type: String, max: 10, trim: true, lowercase: true, default: 'html' },

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

  schema.index({ slug: 1, language: 1, country: 1}, { unique: true });

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName);
  }
  return mongooseClient.model(modelName, schema);
};
