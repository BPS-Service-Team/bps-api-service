const Joi = require('joi');

const STATUS_SCHEMA = Joi.object().keys({
  code: Joi.string().min(8).max(8).required().label('Code'),
  deviceName: Joi.string().min(1).max(32).required().label('Device Name'),
  state: Joi.number().integer().required().label('State'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created By'),
});

const START_FINISH_SCHEMA = Joi.object().keys({
  taskNo: Joi.string().min(1).max(36).required().label('Task No'),
  deviceName: Joi.string().min(1).max(32).required().label('Device Name'),
  taskState: Joi.number().integer().required().label('Task State'),
  lpn: Joi.string().trim().label('LPN'),
});

const CANCEL_WES_SCHEMA = Joi.object().keys({
  task_no: Joi.string().min(1).max(36).required().label('Task No'),
  operation: Joi.string().trim().lowercase().valid('rescan', 'clean').label('Operation'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created By'),
});

const CHECK_SCHEMA = Joi.object().keys({
  taskNo: Joi.string().min(1).max(36).required().label('Task No'),
  deviceName: Joi.string().min(1).max(32).required().label('Device Name'),
  taskState: Joi.number().integer().required().label('Task State'),
  lpn: Joi.string().trim().label('LPN'),
  palletType: Joi.string().max(4).valid('800', '1000').required().label('Pallet Type'),
  checkWidthResult: Joi.number().integer().valid(0, 1, 2).required().label('Checked Width Result'),
  checkHeightResult: Joi.number().integer().valid(0, 1, 2).required().label('Check Height Result'),
});

const CANCEL_SCHEMA = Joi.object().keys({
  taskNo: Joi.string().min(1).max(36).required().label('Task No'),
  deviceName: Joi.string().min(1).max(32).required().label('Device Name'),
  taskState: Joi.number().integer().required().label('Task State'),
  lpn: Joi.string().trim().label('LPN'),
});

const CREATE_SCHEMA = Joi.object().keys({
  taskNo: Joi.string().trim().max(36).required().label('Task No'),
  taskType: Joi.string().trim().max(36).required().label('Task Type'),
  locationSource:	Joi.string().trim().max(16).required().label('Location Source'),
  locationDestination: Joi.string().trim().max(16).required().label('Location Destination'),
  deviceName: Joi.string().trim().max(32).label('Device Name'),
  lpn: Joi.string().trim().max(36).label('LPN'),
  priority: Joi.number().allow('', null).label('Priority'),
  palletType: Joi.string().max(4).required().label('Pallet Type'),
  checkWidth:	Joi.string().max(1).valid('Y', 'N').required().label('Check Width'),
  checkHeight: Joi.string().max(1).valid('Y', 'N').required().label('Check Height'),
  paramter1: Joi.string().trim().max(16).label('Parameter 1'),
  paramter2: Joi.string().trim().max(16).label('Parameter 2'),
  paramter3: Joi.string().trim().max(16).label('Parameter 3'),
  paramter4: Joi.string().trim().max(16).label('Parameter 4'),
});

const REQUEST_SCHEMA = Joi.array().items(
  Joi.object({
    STOCK_NO: Joi.string().trim().max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock No.'),
    ITM_NAME: Joi.string().max(1000).required().label('Stock name'),
    BATCH_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock Batch No.'),
    PACK_KEY: Joi.string().trim().max(2).regex(/^[0-9]/, 'Numbers').allow(null, '').label('Pack Key'),
    SERIAL_NO: Joi.string().allow(null, '').max(80).regex(/^[0-9]/, 'Numbers').required().label('Stock item serial no.'),
    VAL_TYPE: Joi.string().allow(null, '').uppercase().max(100).required().label('SAP Valuation Type.'),
    SHORT_COMING: Joi.boolean().label('Is Short Coming'),
    QTY: Joi.number().integer().min(1).required().label('Quantity'),
    ORDER_ID: Joi.string().trim().max(20).label('Order ID'),
    DATE: Joi.date().label('Insert Date'),
  })
).required().label('Item List');

const POST_SCHEMA = Joi.object().keys({
  order_id: Joi.when(
    'type', {
      is: 'create',
      then: Joi.string().trim().max(20).required().label('Order ID'),
      otherwise: Joi.disallow(),
    }
  ),
  request: Joi.when(
    'type', {
      is: 'create',
      then: REQUEST_SCHEMA,
      otherwise: Joi.disallow(),
    }
  ),
  force_type: Joi.string().trim().max(30).label('Force Type'),
  endpoint: Joi.any().label('Endpoint data'),
  direction: Joi.string().trim().max(20).valid('in', 'out').label('Direction'),
  task_no: Joi.string().trim().max(36).required().label('Task No'),
  type: Joi.string().valid('create', 'cancel', 'start', 'check', 'finish').required().label('Type'),
  payload: Joi.when(
    'type', {
      is: 'start',
      then: START_FINISH_SCHEMA,
      otherwise: Joi.when(
        'type', {
          is: 'check',
          then: CHECK_SCHEMA,
          otherwise: Joi.when(
            'type', {
              is: 'finish',
              then: START_FINISH_SCHEMA,
              otherwise: Joi.when(
                'type', {
                  is: 'cancel',
                  then: CANCEL_SCHEMA,
                  otherwise: CREATE_SCHEMA,
                }
              ),
            }
          )
        }
      )
    }
  ).required().label('Body'),
  result: Joi.any().label('Result'),
  cancel_on_finish: Joi.boolean().label('Cancel on Finish'),
  check: Joi.boolean().default(false).label('Check Height / Width'),
  status: Joi.when(
    'type', {
      is: 'create',
      then: Joi.string().trim().max(10).valid('success', 'fail', 'error').required(),
      otherwise: Joi.disallow(),
    }
  ).label('Status'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created By'),
});

const ROBOT_SCHEMA = Joi.object().keys({
  device_name: Joi.string().trim().max(100).required().label('Device name'),
  lpn: Joi.string().trim().max(100).label('LPN'),
  description: Joi.string().trim().label('Description'),
  status: Joi.number().integer().valid(0, 1, 2, 3, 4, 5).default(0).label('Status'),
  code: Joi.string().trim().max(8).label('Real status'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created By'),
});

const ROBOT_PATCH_SCHEMA = Joi.object().keys({
  device_name: Joi.string().trim().max(100).label('Device name'),
  lpn: Joi.string().trim().max(100).label('LPN'),
  description: Joi.string().trim().label('Description'),
  status: Joi.number().integer().valid(0, 1, 2, 3, 4, 5).label('Status'),
  code: Joi.string().trim().max(8).label('Real status'),
  updated_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Updated By'),
});

module.exports = {
  CANCEL_SCHEMA,
  CANCEL_WES_SCHEMA,
  CREATE_SCHEMA,
  POST_SCHEMA,
  ROBOT_PATCH_SCHEMA,
  ROBOT_SCHEMA,
  STATUS_SCHEMA,
};
