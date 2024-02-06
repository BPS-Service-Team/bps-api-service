// workstations-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'pickup_zones';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema(
    {
      label: { type: String, trim: true, max: 10, unique: true },
      workstation_id: { type: String, trim: true, max: 10 },
      staging_id: { type: Number },
      cmd: { type: String, trim: true, max: 10 },
      r: { type: Number, default: 0 },
      c: { type: Number, default: 0 },
      lv: { type: Number, default: 0 },
      type: { type: Number },
      x: { type: Number },
      y: { type: Number },
      // 1: normal
      // 2: pending, marked to be used
      // 3: in use for staging
      // 4: error
      // 5: repair
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

  schema.index({ workstation_id: 1, staging_id: 1 }, { unique: true });

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName);
  }
  return mongooseClient.model(modelName, schema);
};
