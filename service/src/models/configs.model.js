// configs-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'configurations';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const optionSchema = new Schema(
    {
      value: { type: Schema.Types.Mixed },
      label: { type: String, max: 255, trim: true, lowercase: true },
    },
    {
      _id: false,
    }
  );

  const elementSchema = new Schema(
    {
      name: { type: String, max: 50, trim: true, required: true },
      type: { type: String, max: 20, trim: true, required: true, default: 'text' },
      description: { type: String, max: 255, trim: true },
      slug: { type: String, max: 50, trim: true, lowercase: true, required: true },
      value: { type: Schema.Types.Mixed },
      default: { type: Schema.Types.Mixed },
      sort: { type: Number, default: 0 },
      options: [optionSchema]
    },
    {
      _id: false,
    }
  );

  const schema = new Schema(
    {
      name: { type: String, max: 50, trim: true },
      slug: { type: String, max: 50, trim: true, lowercase: true, unique: true, },
      elements: [elementSchema],

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
