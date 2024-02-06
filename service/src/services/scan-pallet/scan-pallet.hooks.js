const errors = require('@feathersjs/errors');
const { authenticate } = require('@feathersjs/authentication').hooks;
const validate = require('@feathers-plus/validate-joi');

const joiOptions = require('../../utils/joi.options').options();
const Schema = require('../../schemas/scan-pallet.schema');

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [],
    create: [validate.form(Schema.POST_SCHEMA, joiOptions)],
    update: [],
    patch: [],
    remove: [],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      async (context) => {
        const { data } = context,
          { pallet_id, operation, order_id } = data;

        // Validate the size pallet
        let aPallets = pallet_id.split(','),
          sSize = '';

        for (let sPalletId of aPallets) {
          sSize = sPalletId[0];

          if (['L', 'S'].indexOf(sSize) === -1) {
            throw new errors.BadRequest(
              `The size "${sSize}" of pallet "${sPalletId}" is not allowed`
            );
          }
        }

        // Find is the pallet Id already exists into stocks
        let aExist = await context.app.service('stocks').find({
            query: {
              pallet_id: {
                $in: aPallets,
              },
              $select: ['_id', 'label', 'pallet_id', 'stocks'],
            },
          }),
          aOrder = await context.app.service('orders').find({
            query: {
              order_id,
            },
          }),
          order = aOrder.data[0];

        if (!order) {
          throw new errors.BadRequest(
            `Order with ID "${order_id}" does not exist`
          );
        } else if (order.status === 6) {
          throw new errors.BadRequest(
            'Order status is "standby", the order picking related to this putaway must be completed'
          );
        }

        if (operation === 'reserve') {
          if (aExist.total) {
            throw new errors.BadRequest(
              `The following pallets "${aExist.data
                .map((item) => item.pallet_id)
                .join(', ')}" already exist in stock.`
            );
          }

          // Check if exist space for the pallet all reserve
          let aSpaces = await context.app.service('stocks').find({
            query: {
              type: {
                $in: sSize === 'L' ? ['Long'] : ['Short', 'Long'],
              },
              status: 200, // empty
              $select: [
                '_id',
                'label',
                'pallet_id',
                'stocks',
                'status',
                'type',
              ],
              $limit: 99,
            },
          });

          if (!aSpaces.total) {
            throw new errors.BadRequest(
              'There is no space available in the stocks'
            );
          }

          // Clean label
          for (let oSingle of aSpaces.data) {
            oSingle.target = parseInt(oSingle.label.replace(/\D/g, ''), 10);
          }
          aSpaces.data.sort((a, b) => a.target - b.target);

          let aTakes = [];
          for (let i = 0; i < aPallets.length; i++) {
            let oTake = aSpaces.data[i];

            aTakes.push(oTake);
            await context.app.service('stocks').patch(oTake._id, {
              pallet_id: aPallets[i],
              stocks: !oTake.stocks ? [] : oTake.stocks,
              status: 201,
            });
          }

          // Save the pallet id into the order
          if (!order.agf_pallets) {
            order.agf_pallets = [];
          }

          for (let sPalletId of aPallets) {
            if (order.agf_pallets.indexOf(sPalletId) === -1) {
              order.agf_pallets.push(sPalletId);
            }
          }

          await context.app.service('orders').patch(order._id, {
            agf_pallets: order.agf_pallets,
          });

          context.result = aTakes.length === 1 ? aTakes[0] : aTakes;
        } else if (operation === 'release') {
          if (!aExist.total) {
            throw new errors.BadRequest(
              `The following pallets "${aExist.data
                .map((item) => item.pallet_id)
                .join(', ')}" not exist in stock.`
            );
          }

          // Update the pallets id's of the order
          if (!order.agf_pallets) {
            order.agf_pallets = [];
          }

          let aNewData = [];
          for (let sExistId of order.agf_pallets) {
            if (aPallets.indexOf(sExistId) === -1) {
              aNewData.push(sExistId);
            }
          }

          // Otherwise release the stock and update order
          await context.app.service('orders').patch(order._id, {
            agf_pallets: aNewData,
          });

          context.result = await context.app
            .service('stocks')
            .patch(aExist.data[0]._id, {
              pallet_id: '',
              status: 200,
            });
        } else if (operation === 'picking') {
          let aStocks = [];

          if (!aExist.total) {
            throw new errors.BadRequest(`The pallet doesn't exist in stock.`);
          } else {
            const [first] = aExist.data;
            aStocks = first.stocks || [];
          }

          // Change the order status to in process
          await context.app.service('orders').patch(order._id, {
            status: 2,
          });

          context.result = {
            stocks: aStocks,
          };
        }
      },
    ],
    update: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
};
