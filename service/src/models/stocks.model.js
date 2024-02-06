// stocks-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'stocks';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schemaStocks = new Schema({
    ORDER_ID: { type: String, trim: true, max: 20 },
    TASK_NO: { type: String, trim: true },
    STOCK_NO: { type: String, trim: true, max: 80 },
    PACK_KEY: { type: String, trim: true, max: 2 },
    ITM_NAME: { type: String, trim: true, max: 1000 },
    BATCH_NO: { type: String, trim: true, max: 80 },
    SERIAL_NO: { type: String, trim: true, max: 80 },
    VAL_TYPE: { type: String, trim: true, max: 100 },
    QTY: { type: Number },
    DATE: { type: Date },
  });

  const schema = new Schema(
    {
      pallet_id: { type: String, trim: true },
      label: { type: String, trim: true, max: 10, unique: true },
      cmd: { type: String, trim: true, max: 10 },
      type: { type: String, trim: true, max: 10 },
      aisle: { type: String, trim: true, max: 10 },
      position: { type: String, trim: true, max: 10 },
      level: { type: Number },

      // Real contain items
      stocks: [schemaStocks],

      // 200: empty
      // 201: inuse
      // 202: occupied
      // 203: error
      // 204: lock
      status: { type: Number, default: 200 },

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

  schema.index(
    { pallet_id: 1 },
    {
      unique: true,
      partialFilterExpression: {
        pallet_id: { $exists: true, $gt: '' }
      }
    }
  );

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName);
  }
  return mongooseClient.model(modelName, schema);
};
