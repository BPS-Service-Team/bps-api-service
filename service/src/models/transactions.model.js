// transactions-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'transactions';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const stockSchema = new Schema(
    {
      qty: { type: Number },
      stock_no: { type: String, trim: true, max: 80 },
      batch_no: { type: String, trim: true, max: 80 },
      val_type: { type: String, trim: true, max: 100 },
      pack_key: { type: String, trim: true, max: 2 },
      remain: { type: Number },
    }, {
      _id: false,
    }
  );

  const schema = new Schema(
    {
      order_id: { type: String, trim: true, max: 20 },
      process: { type: String, trim: true, lowercase: true, max: 20 },
      from: { type: String, trim: true },
      to: { type: String, trim: true },
      pallet_id: { type: String, trim: true, max: 50 },
      items: [stockSchema],
      reason: { type: String, trim: true },
      remarks: { type: String, trim: true },
      created_by: { type: Schema.Types.ObjectId, ref: 'users' },
    },
    {
      timestamps: {
        createdAt: 'created_at',
        updatedAt: false,
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
