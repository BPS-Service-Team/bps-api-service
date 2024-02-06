const errors = require('@feathersjs/errors');

const { checkIsOrderComplete, readyAgv } = require('../../../utils/putaways');
const joiOptions = require('../../../utils/joi.options').options();
const Schemas = require('../../../schemas/pickings.schema');
const i18n = require('../../../utils/i18n');
const logger = require('../../../logger');
const Utils = require('../../../utils');

const afterRelease = async (app, params, order) => {
  // Find all task relation with the order
  const tasks = await app.service('agf-tasks').find({
      query: {
        order_id: order.order_id,
        direction: 'out',
        status: {
          $in: [2, 3]
        },
        $select: ['_id', 'location_source', 'location_destination'],
      }
    }),
    aPickups = tasks.data.map(item => item.location_destination),
    pickups = aPickups.length ? await app.service('pickup-zones').find({
      query: {
        label: {
          $in: aPickups
        },
        status: {
          $in: [2, 3]
        },
        $select: ['_id'],
      }
    }) : undefined,
    aStocks = tasks.data.map(item => item.location_source),
    stocks = aStocks.length ? await app.service('stocks').find({
      query: {
        label: {
          $in: aStocks,
        },
        status: 202,
        $select: ['_id'],
      }
    }) : undefined;

  if (tasks || pickups || stocks) {
    const mongooseClient = app.get('mongooseClient'),
      { tasks: mdlTask, stocks: mdlStock, pickupZones: mdlPick } = mongooseClient.models;

    if (tasks.data.length) {
      await mdlTask.updateMany(
        {
          _id: {
            $in: tasks.data.map(item => item._id),
          },
        }, {
          status: 5,
        }
      );

      if (pickups.data.length) {
        await mdlPick.updateMany(
          {
            _id: {
              $in: pickups.data.map(item => item._id),
            }
          }, {
            status: 1,
          }
        );
      }

      if (stocks.data.length) {
        await mdlStock.updateMany(
          {
            _id: {
              $in: stocks.data.map(item => item._id),
            }
          }, {
            status: 201,
          }
        );
      }
    }
  }
};

exports.PickingRelease = class PickingRelease {
  constructor(options, app) {
    this.options = options || {};
    this.app = app || undefined;
  }

  async create(data, params) {
    let oValidation, oResult;

    try {
      const { order_id, label: workstation_id } = data,
        app = this.app,
        user_id = data.created_by;

      delete data.created_by;
      oValidation = await Schemas.RELEASE_SCHEMA.validate(data, joiOptions);

      if (oValidation.error) {
        throw new errors.BadRequest('Data Invalid', {
          errors: Utils.fnParseErrors(oValidation.error),
          method: params.method,
          path: params.path,
          type: params.type,
        });
      }

      params.provider = undefined;

      let aZones;
      if (workstation_id.length) {
        // Find the corresponding pickup zone
        aZones = await app.service('pickup-zones').find({
          query: {
            label: {
              $in: workstation_id,
            },
          },
        });

        if (!aZones.total) {
          throw new errors.BadRequest(
            `Pickup Zones not found`
          );
        }
      }

      let aOrder = await app.service('orders').find({
          query: {
            order_id,
            $limit: 1,
          },
        }),
        order = aOrder.data[0];

      if (!order) {
        throw new errors.BadRequest(
          `The order with ID "${order_id}" doesn't exist`
        );
      } else if (order.status !== 1 && order.status !== 2 && order.status !== 5) {
        let oLog = {
          type: 'picking',
          from: {
            text: 'WES',
            domain: params.ip,
          },
          to: {
            text: 'WES',
            domain: params.ip,
          },
          order_id: order.order_id,
          command: 'picking/release',
          request: data,
          reply: 'success',
          created_by: user_id,
          status: 1,
        };

        await app.service('wms-logs').create(oLog);
        throw new errors.BadRequest('The order is not in "process" status');
      }

      if (aZones) {
        for (let zone of aZones.data) {
          await app.service('pickup-zones').patch(
            zone._id,
            {
              status: 1,
            },
            params
          );
        }
      }

      // search for agv pending tasks
      const aPendingAGVTasks = await app.service('agv-tasks').find({
        query: {
          order_id: order.order_id,
          status: 1,
        },
      });

      let oExtraResults = {};
      if (aPendingAGVTasks.total) {
        oExtraResults = {
          message: 'Workstation Released. The order cannot be finish. It has pending AGV orders',
        };
      } else {
        order = await app.service('orders').patch(order._id, { status: 3 }, params);
        checkIsOrderComplete(order.order_id, app, params, data);
      }

      await afterRelease(app, params, order);

      // Validation for picking from relocation order
      // This is a global replacing of matching lines, if its required to
      //  make a replace under certain cases we need to iterate the
      // relocation order details and look only for AGV -> AGF or AGF -> AGV
      if (order.relocation) {
        const aRelatedPutaway = await app.service('orders').find({
          query: {
            order_id: `${order.relocation}A`,
          },
        });
        const oRelatedPutaway = aRelatedPutaway.data[0];
        if (oRelatedPutaway) {
          let aAGFLines = oRelatedPutaway.agf;
          let aAGVLines = oRelatedPutaway.agv;
          for (const oAgfLine of aAGFLines) {
            let aFinded = order.agf.filter(
              item => item.DOD_SEQ === oAgfLine.GRD_SEQ
            );

            if (aFinded.length) {
              let nAmount = 0;
              for (const oFind of aFinded) {
                nAmount += oFind.PICK_QTY;
              }
              oAgfLine.SUG_PA_QTY = nAmount;
            }
          }

          for (const oAgvLine of aAGVLines) {
            let aFinded = order.agf.filter(
              item => item.DOD_SEQ === oAgvLine.GRD_SEQ
            );

            if (aFinded.length) {
              let nAmount = 0;
              for (const oFind of aFinded) {
                nAmount += oFind.PICK_QTY;
              }
              oAgvLine.SUG_PA_QTY = nAmount;
            }
          }

          await app.service('orders').patch(oRelatedPutaway._id, {
            status: 1,
            agf: aAGFLines,
            agv: aAGVLines,
          });

          if (!aPendingAGVTasks.total && aAGVLines.length) {
            await readyAgv(app, params, oRelatedPutaway);
          }
        }
      }

      let oLog = {
        type: 'picking',
        from: {
          text: 'WES',
          domain: params.ip,
        },
        to: {
          text: 'WES',
          domain: params.ip,
        },
        order_id: order.order_id,
        command: 'picking/release',
        request: data,
        reply: 'success',
        created_by: user_id,
        status: 1,
      };

      await app.service('wms-logs').create(oLog);

      oResult = {
        errno: 0,
        message: i18n.single('insert_record_success'),
        result: 'success',
        ...oExtraResults,
      };
    } catch (err) {
      logger.error('[PickingRelease/create] Error: %s', err.message || (typeof err === 'string' ? err : JSON.stringify(err)));
      oResult = {
        errno: 1,
        message: err.message,
        result: 'fail',
        errors: err.errors || undefined,
      };
    }

    return oResult;
  }
};
