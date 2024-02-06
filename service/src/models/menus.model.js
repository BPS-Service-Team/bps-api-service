// menus-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'menus';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const l3Schema = new Schema(
    {
      text: { type: String, trim: true },
      slug: { type: String, trim: true, lowercase: true },
      path: { type: String, max: 100, trim: true, lowercase: true },
      icon: { type: String, max: 255, trim: true },
      is_divider: { type: Boolean },
    },
    {
      _id: false,
    }
  );

  const l2Schema = new Schema(
    {
      text: { type: String, trim: true },
      slug: { type: String, trim: true, lowercase: true },
      path: { type: String, max: 100, trim: true, lowercase: true },
      icon: { type: String, max: 255, trim: true },
      is_divider: { type: Boolean },
      children: [l3Schema],
    },
    {
      _id: false,
    }
  );

  const l1Schema = new Schema(
    {
      text: { type: String, trim: true },
      slug: { type: String, trim: true, lowercase: true },
      path: { type: String, max: 100, trim: true, lowercase: true },
      icon: { type: String, max: 255, trim: true },
      is_divider: { type: Boolean },
      children: [l2Schema],
    },
    {
      _id: false,
    }
  );

  const panelSchema = new Schema(
    {
      text: { type: String, trim: true },
      slug: { type: String, trim: true, lowercase: true },
      description: { type: String, max: 255, trim: true, lowercase: true },
      path: { type: String, max: 100, trim: true, lowercase: true },
      icon: { type: String, max: 255, trim: true },
    },
    {
      _id: false,
    }
  );

  const menuSchema = new Schema(
    {
      main: [l1Schema],
      panel: [panelSchema],
    },
    {
      _id: false,
    }
  );

  const schema = new Schema(
    {
      rol_id: { type: Schema.Types.ObjectId, ref: 'roles', ref_name: 'Roles', ref_single: 'Rol', unique: true, required: true, },
      name: { type: String, trim: true, required: true },
      menus: menuSchema,

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

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName);
  }
  return mongooseClient.model(modelName, schema);
};
