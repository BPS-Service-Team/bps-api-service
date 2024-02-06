// orders-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'orders';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;

  const detailSchema = new Schema(
    {
      type: { type: String, trim: true },
      status: { type: Number, default: 0 },
      from: { type: String, trim: true },
      to: { type: String, trim: true },
      payload: { type: Schema.Types.Mixed },
      seq: { type: Number },
    }
  );

  const schema = new Schema(
    {
      // GR CODE
      order_id: { type: String, trim: true, max: 20, unique: true },
      //INTERFACE NAME
      interface_name: { type: String, trim: true },
      // BATCHID
      batch_id: { type: String, trim: true, max: 30 },
      // Request type
      // - picking
      // - putaway
      // - return
      // - relocation
      type: { type: String, trim: true, max: 20 },

      // 1 - open
      // 2 - in-process
      // 3 - finish
      // 4 - error
      // 5 - cancelled
      // 6 - standby
      status: { type: Number, default: 1 },
      cancelled: { type: Boolean, default: false },
      cancel_on_finish: { type: Boolean, default: false },

      // Pallets
      agv_pallets: [{ type: String, trim: true }],
      agf_pallets: [{ type: String, trim: true }],

      agv_status: { type: Number, default: -1 },
      agf_status: { type: Number, default: -1 },
      agv: [{ type: Schema.Types.Mixed }],
      agf: [{ type: Schema.Types.Mixed }],

      start_time: { type: Date },
      complete_time: { type: Date },

      details: [detailSchema],
      relocation: { type: String, trim: true, max: 20 },
      pending_feedback: { type: Boolean, default: false },
      calculate: { type: Schema.Types.Mixed },

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
