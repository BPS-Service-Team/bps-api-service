const { authenticate } = require('@feathersjs/authentication').hooks;
const { iff, isProvider } = require('feathers-hooks-common');
const validate = require('@feathers-plus/validate-joi');
const errors = require('@feathersjs/errors');

const joiOptions = require('../../utils/joi.options').options();
const Schema = require('../../schemas/recalculation.schema');

module.exports = {
  before: {
    all: [authenticate('jwt')],
    create: [validate.form(Schema.POST_SCHEMA, joiOptions)],
  },

  after: {
    all: [],
    create: [
      iff(
        isProvider('rest'),
        async context => {
          const { data } = context,
            { user } = context.params,
            { label, stocks, workstation_id } = data,
            mongooseClient = context.app.get('mongooseClient'),
            model = mongooseClient.models['stocks'];

          if (label) {
            const row = await context.app.service('stocks').find({
              paginate: false,
              query: {
                label,
                $limit: 1,
              }
            });

            if (!row.length) {
              throw new errors.BadRequest(`Cannot find the stock with the label "${label}"`);
            }
            const rowData = row[0];

            let aNewStocks = [],
              aReturned = [],
              // Create transaction objet
              oTransaction = {
                order_id: 'RC888',
                process: 'adjustment',
                from: workstation_id,
                to: rowData.label,
                pallet_id: rowData.pallet_id,
                reason: 'Recalculation',
                items: [],
                created_by: user._id.toString(),
              };

            for (let single of stocks) {
              // Find into current stock
              let exist = rowData.stocks.find(
                item => item._id.toString() === single._id
              );

              let blnRemoved = false;
              // If the quantity is more than 0, add to new stock and returned array
              if (single.qty > 0) {
                aNewStocks.push({ ...exist, QTY: single.qty });
                aReturned.push({
                  BATCH_NO: exist.BATCH_NO,
                  ITM_NAME: exist.ITM_NAME,
                  QTY: single.qty,
                  SERIAL_NO: exist.SERIAL_NO,
                  STOCK_NO: exist.STOCK_NO,
                  VAL_TYPE: exist.VAL_TYPE,
                });
              } else {
                blnRemoved = true;
              }

              // Add the transaction item changes into the transaction
              const qtyRecal = blnRemoved ? 0 - exist.QTY : single.qty - exist.QTY;
              if (qtyRecal !== 0) {
                oTransaction.items.push({
                  qty: qtyRecal,
                  stock_no: exist.STOCK_NO,
                  batch_no: exist.BATCH_NO,
                  val_type: exist.VAL_TYPE,
                  pack_key: exist.PACK_KEY,
                });
              }
            }

            let $set = {
                updated_at: new Date(),
                updated_by: user._id,
              },
              size = rowData.pallet_id[0],
              sTaskId;

            // Free stock
            $set.stocks = aNewStocks;
            if (!aNewStocks.length) {
              $set.pallet_id = '';
              $set.status = 200;
            } else if (aReturned.length) {
              // Register task to return the stock
              sTaskId = `T${new Date().getTime()}`;
              let oAgfRequest = {
                order_id: 'RC888',
                direction: 'in',
                task_no: sTaskId,
                type: 'create',
                request: aReturned,
                payload: {
                  lpn: workstation_id,
                  taskNo: sTaskId,
                  taskType: 'Inbound',
                  locationSource: workstation_id,
                  locationDestination: label,
                  palletType: size === 'S' ? '800' : '1000',
                  checkWidth: 'N',
                  checkHeight: 'N',
                },
                created_by: user._id.toString(),
              };

              const register = await context.app.service('agf-tasks').create(oAgfRequest);

              if (register.status === 'error') {
                throw new errors.BadRequest(
                  `Something went wrong in AGF call. ${
                    register.result.message || register.result
                  }`
                );
              } else if (register.status === 'fail') {
                throw new errors.BadRequest(
                  `AGF response with an error. Error (${register.result.errorCode}): ${register.result.errorMessage}`
                );
              }
            }

            // Update the stock
            await model.updateOne(
              {
                '_id': rowData._id,
              }, {
                $set,
              }
            );

            // Save transaction information
            let transaction = await context.app.service('transactions').create(oTransaction);

            context.result = {
              task_no: sTaskId,
              transaction_id: transaction._id,
            };
          }
        }
      )
    ],
  },

  error: {
    all: [],
    create: [],
  },
};
