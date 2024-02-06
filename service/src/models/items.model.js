const Double = require('@mongoosejs/double');

// items-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'items';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema(
    {
      stock_no: { type: String, trim: true, unique: true },
      cbm: { type: Double, default: null },
      gross_weight: { type: Double, default: null },
      height: { type: Double, default: null },
      itm_name: { type: String, trim: true },
      length: { type: Double, default: null },
      long_desc: { type: String, trim: true },
      min_stk_lv: { type: Number, default: null },
      min_stock_lv_agf: { type: Number, default: null },
      min_stock_lv_agv: { type: Number, default: null },
      net_weight: { type: Double, default: null },
      plant: { type: String, trim: true },
      status: { type: Number, default: 1 },
      stock_type: { type: String, trim: true },
      uom: { type: String, trim: true, max: 40 },
      width: { type: Double, default: null },

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
