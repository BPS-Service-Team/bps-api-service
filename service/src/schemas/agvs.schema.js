const Joi = require('joi');

const SHELF_BIN_LIST_SCHEME = Joi.object().keys({
  shelf_code: Joi.string().trim().max(256).allow('', null).label('Shelf Code'),
  shelf_bin_code: Joi.string().trim().max(256).allow('', null).label('Shelf Bin Code'),
  quantity: Joi.number().allow('', null).label('Quantity'),
  operator: Joi.string().trim().max(256).allow('', null).label('Operator'),
});

const GD_CODE_RELATIONSHIP_SCHEMA = Joi.object().keys({
  twoDimensionCode: Joi.string().trim().max(32).allow('', null).label('QR Code'),
  num: Joi.number().allow('', null).label('Quantity'),
});

const PICK_CREATE_LIST_SCHEMA = Joi.object().keys({
  amount: Joi.number().integer().required().label('Quantity'),
  bar_code: Joi.string().trim().max(32).label('Bar Code'),
  cell_code: Joi.string().trim().max(100).allow('', null).label('Cell Code'),
  expiration_date: Joi.number().allow('', null).label('Expiration Date'),
  is_sequence_sku: Joi.number().allow(null).label('Is Sequence SKU Or Not'),
  item: Joi.number().allow('', null).label('Item'),
  mini_packing_count: Joi.number().allow('', null).label('First Level Packing'),
  out_batch_code: Joi.string().trim().max(32).allow('', null).label('External Batch'),
  owner_code: Joi.string().trim().max(16).label('Goods Owner'),
  pack_key: Joi.string().trim().max(32).allow('', null).label('Pack key'),
  packing_spec: Joi.string().trim().max(16).label('Packing Specification'),
  product_batch: Joi.string().trim().max(255).allow('', null).label('Product Batch Code'),
  production_date: Joi.number().allow('', null).label('Production Date'),
  remark: Joi.string().trim().max(64).allow('', null).label('Remark'),
  second_packing_count: Joi.number().allow('', null).label('Second Level Packing'),
  sequence_no: Joi.string().trim().max(32).allow('', null).label('Sequence No'),
  sku_code: Joi.string().trim().max(32).required().label('SKU Code'),
  sku_id: Joi.string().trim().max(32).label('SKU Id'),
  sku_level: Joi.number().allow('', null).valid(0, 1).required().label('SKU Quality'),
  sku_version: Joi.string().trim().max(32).label('SKU Version'),
  third_packing_count: Joi.number().allow('', null).label('Third Level Packing'),
  valuation_type: Joi.string().trim().max(32).allow('', null).label('Valuation Type'),
  sku_reservation_1: Joi.string().trim().max(16).allow('', null).label('Sequence Aux'),
});

const CREATE_LIST_SCHEMA = Joi.object().keys({
  item: Joi.number().allow('', null).label('Item'),
  sku_code: Joi.string().trim().max(32).required().label('SKU Code'),
  container_code: Joi.string().trim().max(32).label('Container'),
  owner_code: Joi.string().trim().max(16).label('Goods Owner'),
  sku_id: Joi.string().trim().max(32).label('SKU Id'),
  bar_code: Joi.string().trim().max(32).label('Bar Code'),
  sku_name: Joi.string().trim().max(128).label('SKU Name'),
  amount: Joi.number().integer().required().label('Quantity'),
  sku_level: Joi.number().integer().valid(0, 1).required().label('SKU Quality'),
  production_date: Joi.number().allow('', null).label('Production Date'),
  expiration_date: Joi.number().allow('', null).label('Expiration Date'),
  out_batch_code: Joi.string().trim().max(32).allow('', null).label('External Batch'),
  packing_spec: Joi.string().trim().max(16).label('Packing Specification'),
  third_packing_count: Joi.number().allow('', null).label('Third Level Packing'),
  second_packing_count: Joi.number().allow('', null).label('Second Level Packing'),
  mini_packing_count: Joi.number().allow('', null).label('First Level Packing'),
  can_deposit_amount:	Joi.number().allow('', null).label('Deposit Quantity In Shief Bin'),
  sku_version: Joi.string().trim().max(32).label('SKU Version'),
  product_code: Joi.string().trim().max(64).label('Product Code'),
  consignor_province: Joi.string().trim().max(16).label('Consignor Provice'),
  consignor_city: Joi.string().trim().max(32).label('Consignor City'),
  consignor_district: Joi.string().trim().max(32).label('Consignor District'),
  consignor_address: Joi.string().trim().max(256).label('Consignor Address'),
  consignor_zip_code: Joi.string().trim().max(8).label('Consignor Zip Code'),
  consignor: Joi.string().trim().max(32).label('Consignor'),
  consignor_phone: Joi.string().trim().max(18).label('Consignor Phone'),
  consignor_tel: Joi.string().trim().max(24).label('Consignor Telephone'),
  pack_key: Joi.string().trim().max(32).allow('', null).label('Pack key'),
  valuation_type: Joi.string().trim().max(32).allow('', null).label('Valuation Type'),
  sku_reservation_1: Joi.string().trim().max(16).allow('', null).label('Sequence Aux'),
});

const SKU_LIST_SCHEMA = Joi.object().keys({
  owner_code: Joi.string().trim().max(16).required().label('Owner Code'),
  owner_name: Joi.string().trim().max(64).label('Owner Name'),
  sku_code: Joi.string().trim().max(64).required().label('SKU Code'),
  sku_id: Joi.string().trim().max(32).label('SKU Id'),
  sku_name: Joi.string().trim().max(512).label('SKU Name'),
  remark: Joi.string().trim().max(255).label('Remark'),
  unit: Joi.string().trim().max(12).label('Unit'),
  shelf_life: Joi.number().integer().max(9999).label('Shelf Life'),
  sku_status: Joi.number().integer().valid(0, 1).default(1).label('SKU Status'),
  sku_type: Joi.number().integer().default(0).label('SKU Type'),
  wares_type_code: Joi.string().trim().max(64).label('Wares Type Code'),
  wares_type_code_1: Joi.number().integer().max(9999).label('Wares Type 1'),
  wares_type_code_2: Joi.number().integer().max(9999).label('Wares Type 2'),
  wares_type_id_3: Joi.number().integer().max(9999).label('Wares Type 3'),
  sku_price: Joi.number().precision(3).label('SKU Price'),
  length: Joi.number().precision(1).label('SKU Width'),
  width: Joi.number().precision(1).label('SKU Width'),
  height: Joi.number().precision(1).label('SKU Height'),
  volume: Joi.number().precision(3).label('SKU Volume'),
  net_weight: Joi.number().precision(3).label('SKU Net Weight'),
  gross_weight: Joi.number().precision(3).label('SKU Gross Weight'),
  min_count: Joi.number().allow('', null).label('Minimum Inventory Limitation'),
  max_count: Joi.number().allow('', null).label('Maximum Inventory Limitation'),
  production_original: Joi.string().trim().max(64).label('Place of Production'),
  specification: Joi.string().trim().max(100).label('SKU Specification'),
  sku_brand: Joi.string().trim().max(32).label('SKU Brand'),
  item_size: Joi.string().trim().max(100).label('SKU Size'),
  item_color: Joi.string().trim().max(100).label('SKU Color'),
  pic_url: Joi.string().trim().max(128).label('Product Picture URL'),
  item_style: Joi.string().trim().max(100).label('Style'),
  is_sequence_sku: Joi.number().integer().valid(0, 1).label('Is Sequence SKU'),
  is_fragile: Joi.number().integer().valid(0, 1).label('Fragile Goods'),
  is_dangerous: Joi.number().integer().valid(0, 1).label('Dangerous Goods'),
  is_precious: Joi.number().integer().valid(0, 1).label('High Value Goods'),
  is_irregularshape: Joi.number().integer().valid(0, 1).label('Irregular Shape Goods'),
  is_need_exp_manage: Joi.number().integer().valid(0, 1).label('Expiration Manage Required'),
  is_need_batch_manage: Joi.number().integer().valid(0, 1).label('Batch Manage Required'),
  is_material: Joi.number().integer().valid(0, 1).label('Packing Material Required'),
  bar_code_list: Joi.array().items(Joi.object().keys({
    sku_code: Joi.string().trim().max(64).label('SKU Code'),
    bar_code: Joi.string().trim().max(32).required().label('SKU Bar Code'),
  })),
  sku_packing: Joi.array().items(Joi.object().keys({
    sku_code: Joi.string().trim().max(64).label('SKU Code'),
    packing_spec: Joi.string().trim().max(16).label('Packing Specification'),
    mini_packing_code: Joi.string().trim().max(32).label('First Level Packing Bar Code'),
    mini_length: Joi.number().precision(1).label('Length'),
    mini_width: Joi.number().precision(1).label('Width'),
    mini_height: Joi.number().precision(1).label('Height'),
    mini_volume: Joi.number().precision(3).label('Volume'),
    mini_weight: Joi.number().precision(1).label('Weight'),
    mini_packing_amount: Joi.number().allow('', null).label('First Level Packing Quantity'),
    second_packing_code: Joi.string().trim().max(32).label('Second Level Packing Bar Code'),
    second_length: Joi.number().precision(1).label('Second Level Length'),
    second_width: Joi.number().precision(1).label('Second Level Width'),
    second_height: Joi.number().precision(1).label('Second Level Height'),
    second_volume: Joi.number().precision(3).label('Second Level Volume'),
    second_weight: Joi.number().precision(1).label('Second Level Weight'),
    second_packing_amount: Joi.number().allow('', null).label('Second Level Packing Quantity'),
    third_packing_code: Joi.string().trim().max(32).label('Third Level Packing Bar Code'),
    third_length: Joi.number().precision(1).label('Third Level Length'),
    third_width: Joi.number().precision(1).label('Third Level Width'),
    third_height: Joi.number().precision(1).label('Third Level Height'),
    third_volume: Joi.number().precision(3).label('Third Level Volume'),
    third_weight: Joi.number().precision(1).label('Third Level Weight'),
    third_packing_amount: Joi.number().allow('', null).label('Third Level Packing Quantity'),
  })),
});

const SKU_SYNC_SCHEMA = Joi.object().keys({
  sku_amount: Joi.number().integer().required().label('SKU Amount'),
  sku_list: Joi.array().items(SKU_LIST_SCHEMA),
});

const DELIVERY_LIST_SCHEMA = Joi.object().keys({
  warehouse_code: Joi.string().trim().max(16).required().label('Warehouse'),
  out_order_code: Joi.string().trim().max(32).required().label('Goods Delivery Note Code'),
  owner_code: Joi.string().trim().max(16).required().label('Goods Owner'),
  order_type: Joi.number().integer().required().label('Receiving Type'),
  creation_date: Joi.number().required().label('Creation Date'),
  sku_list: Joi.array().items(PICK_CREATE_LIST_SCHEMA),
});

const RECEIPT_LIST_SCHEMA = Joi.object().keys({
  receipt_code: Joi.string().trim().max(32).required().label('Goods Receipt Code'),
  pallet_code: Joi.string().trim().max(32).label('Pallet Code'),
  orig_note: Joi.string().trim().max(32),
  related_receipt: Joi.string().trim().max(32).label('Related Receipt'),
  type: Joi.number().integer().required().label('Receiving Type'),
  creation_date: Joi.number().label('Creation Date'),
  supplier_code: Joi.string().trim().max(16).allow('', null).label('Supplier Code'),
  carrier_code: Joi.string().trim().max(16).allow('', null).label('Carrier Code'),
  sku_amount: Joi.number().allow('', null).label('SKU Total Amount'),
  sku_type_amount: Joi.number().allow('', null).label('SKU Type Total Amount'),
  remark: Joi.string().trim().max(1024).label('Remark'),
  orig_plantform_code: Joi.string().trim().max(32).label('Original Plantform Code'),
  source_warehouse_code: Joi.string().trim().max(20).label('Source warehouse code'),
  target_warehouse_code: Joi.string().trim().max(20).label('Target warehouse code'),
  orig_order_code: Joi.string().trim().max(64).label('Origin order code'),
  new_waybill_code: Joi.string().trim().max(64).label('New waybill code'),
  sku_list: Joi.array().items(CREATE_LIST_SCHEMA),
});

const GD_CREATION_SCHEMA = Joi.object().keys({
  header: Joi.any().label('Header'),
  body: Joi.object().keys({
    order_amount: Joi.number().integer().min(1).required().label('Order Amount'),
    order_list: Joi.array().items(DELIVERY_LIST_SCHEMA).min(1),
  }).label('Body'),
});

const GR_CREATION_SCHEMA = Joi.object().keys({
  header: Joi.any().label('Header'),
  body: Joi.object().keys({
    receipt_amount: Joi.number().integer().min(1).required().label('Receipt Amount'),
    receipt_list: Joi.array().items(RECEIPT_LIST_SCHEMA).min(1),
  }).label('Body'),
});

const GR_FEEDBACK_LIST_SCHEMA = Joi.object().keys({
  warehouse_code: Joi.string().trim().max(16).required().label('Warehouse'),
  receipt_code: Joi.string().trim().max(32).required().label('Goods Receipt Code'),
  status: Joi.number().allow('', null).required().label('Good Receipt Status'),
  type: Joi.number().allow('', null).required().label('Type'),
  completion_time: Joi.number().required().label('Putaway Completion Time'),
  receipt_status: Joi.number().required().label('Receipt Status'),
  pallet_code: Joi.string().trim().max(32).allow('', null).label('Pallet Code'),
  start_time: Joi.number().allow('', null).label('Putaway Start Time'),
  receiptor: Joi.string().trim().max(32).allow('', null).label('Receiver'),
  is_cancel: Joi.number().allow('', null).label('Is Cancelled Or Not'),
  supplier_code: Joi.string().trim().max(16).allow('', null).label('Supplier Code'),
  carrier_code: Joi.string().trim().max(16).allow('', null).label('Carrier Code'),
  plan_sku_amount: Joi.number().allow('', null).label('Total Number of Planned Received SKU'),
  plan_sku_type_amount: Joi.number().allow('', null).label('Total Number of Planned Received SKU Type'),
  sku_amount: Joi.number().allow('', null).label('Actual Number of Planned Received SKU'),
  sku_type_amount: Joi.number().allow('', null).label('Actual Number of Planned Received SKU Type'),
  sku_list: Joi.array().items(Joi.object().keys({
    item: Joi.number().integer().required().label('Item'),
    sku_code: Joi.string().trim().max(32).required('SKU Code'),
    sku_name: Joi.string().trim().max(128).required().label('SKU Name'),
    receipt_flag: Joi.number().integer().required().label('Receipt Flag'),
    owner_code: Joi.string().trim().max(16).required().label('Goods owner'),
    amount: Joi.number().integer().required().label('Actual Receive Quantity'),
    sku_level: Joi.number().integer().required().label('SKU Quality'),
    pack_key: Joi.string().trim().max(32).allow(null, '').label('Pack key'),
    sku_id: Joi.string().trim().max(32).allow('', null).label('SKU Id'),
    bar_code: Joi.string().trim().max(32).allow('', null).label('Bar Code'),
    container_code: Joi.string().trim().max(32).allow('', null).label('Container'),
    plan_amount: Joi.number().allow('', null).label('Planned Receive Quantity'),
    production_date: Joi.number().allow('', null).label('Production Date'),
    expiration_date: Joi.number().allow('', null).label('Expiration Date'),
    out_batch_code: Joi.string().trim().max(32).allow('', null).label('External Batch'),
    packing_spec: Joi.string().trim().max(16).allow('', null).label('Packing Specication'),
    valuation_type: Joi.string().trim().max(32).allow('', null).label('Valuation Type'),
    sku_reservation_1: Joi.string().trim().max(16).allow('', null).label('Sequence Aux'),
    code_relationship: Joi.array().items(GD_CODE_RELATIONSHIP_SCHEMA).label('QR Code Specification'),
    shelf_bin_list: Joi.array().items(SHELF_BIN_LIST_SCHEME).label('Shelf bin specification'),
  })),
});

const GR_FEEDBACK_SCHEMA = Joi.object().keys({
  header: Joi.any().label('Header'),
  body: Joi.object().keys({
    receipt_amount: Joi.number().integer().min(1).required().label('Receipt Amount'),
    receipt_list: Joi.array().items(GR_FEEDBACK_LIST_SCHEMA).min(1),
  }).label('Body'),
});

const IR_RECONCILIATION_SCHEMA = Joi.object().keys({
  header: Joi.any().label('Header'),
  body: Joi.object().keys({
    warehouse_code: Joi.string().trim().max(16).required().label('Warehouse'),
    audit_time: Joi.number().label('Audit Time'),
    current_page: Joi.number().integer().label('Current page'),
    total_page: Joi.number().integer().label('Total page'),
    total_page_num: Joi.number().integer().label('Total page number'),
    page_size: Joi.number().integer().label('Page size'),
    sku_list: Joi.array().items(
      Joi.object().keys({
        warehouse_code: Joi.string().trim().max(16).required().label('Warehouse'),
        owner_code: Joi.string().trim().max(16).required().label('Goods Owner'),
        sku_code: Joi.string().trim().max(64).required().label('SKU Code'),
        amount: Joi.number().integer().required().label('Quantity'),
        audit_time: Joi.number().label('Audit Time'),
        packing_spec: Joi.string().trim().max(16).label('Packing Specification'),
        pack_key: Joi.string().trim().max(32).allow(null, '').label('Pack key'),
        valuation_type: Joi.string().trim().max(32).allow(null, '').label('Valuation Type'),
        expiration_date: Joi.number().label('Expiration Date'),
        out_batch_code: Joi.string().trim().max(32).allow('', null).label('External Batch'),
        production_date: Joi.number().label('Production Date'),
        shelf_bin_code: Joi.string().trim().max(256).label('Shelf Bin Code'),
        shelf_code: Joi.string().trim().max(256).label('Shelf Code'),
        sku_id: Joi.string().trim().max(32).allow('', null).label('SKU ID'),
        sku_level: Joi.number().valid(0, 1, null).label('SKU Quality'),
      })
    ),
  }).label('Body'),
});

const GD_FEEDBACK_SCHEMA = Joi.object().keys({
  header: Joi.any().label('Header'),
  body: Joi.object().keys({
    order_amount: Joi.number().integer().required().label('Order amount'),
    order_list: Joi.array().items(
      Joi.object().keys({
        warehouse_code: Joi.string().trim().max(16).required().label('Warehouse'),
        out_order_code: Joi.string().trim().max(32).required().label('Goods Delivery Note Code'),
        order_type: Joi.number().integer().required().label('Order Type'),
        status: Joi.number().integer().required().label('Status'),
        is_exception: Joi.number().integer().required().label('Is Exception'),
        owner_code: Joi.string().trim().max(16).required().label('Owner Code'),
        finish_date: Joi.number().required().label('Picking Finish Time'),
        lack_flag: Joi.number().integer().required().label('Short Delivery Flag'),
        consignee_address: Joi.string().trim().max(256).allow('', null).label('Consignee Address'),
        consignee_code: Joi.string().trim().max(32).allow('', null).label('Consigne Code'),
        start_time: Joi.number().allow('', null).label('Picking Start time'),
        picker: Joi.string().trim().max(32).allow('', null).label('Picker'),
        pkg_amount: Joi.number().allow('', null).label('Package Quantity'),
        container_amount: Joi.number().allow('', null).label('Container Quantity'),
        pick_type: Joi.number().integer().allow('', null).label('Picking Type'),
        inf_function: Joi.number().allow('', null).label('Is Feedback By Container Or Not'),
        shop_code: Joi.string().trim().max(32).allow('', null).label('Shop Code'),
        shop_name: Joi.string().trim().max(64).allow('', null).label('Shop Name'),
        plan_sku_amount: Joi.number().allow('', null).label('Total Planned SKU Quantity'),
        pickup_sku_amount: Joi.number().allow('', null).label('Total Picked SKU Quantity'),
        wall_code: Joi.string().trim().max(20).allow('', null).label('Wall Code'),
        sku_list: Joi.array().items(
          Joi.object().keys({
            sku_code: Joi.string().trim().max(64).required().label('SKU Code'),
            owner_code: Joi.string().trim().max(16).required().label('Owner Code'),
            plan_amount: Joi.number().integer().required().label('Plan Quantity'),
            pickup_amount: Joi.number().integer().required().label('Picking Quantity'),
            sku_level: Joi.number().integer().valid(0, 1).required().label('SKU Quality'),
            pack_key: Joi.string().trim().max(32).allow(null, '').label('Pack key'),
            item: Joi.number().allow('', null).label('Item'),
            sku_id: Joi.string().trim().max(32).allow('', null).label('SKU ID'),
            is_sequence_sku: Joi.number().allow('', null).label('Is Sequence SKU'),
            sequence_no: Joi.string().trim().max(32).allow('', null).label('Sequence Number'),
            packing_spec: Joi.string().trim().max(16).allow('', null).label('Packing Specification'),
            production_date: Joi.number().allow('', null).label('Production Date'),
            expiration_date: Joi.number().allow('', null).label('Expiration Date'),
            out_batch_code: Joi.string().trim().max(32).allow('', null).label('External Batch'),
            bar_code: Joi.string().trim().max(64).allow('', null).label('Bar Code'),
            remark: Joi.string().trim().max(64).allow('', null).label('Remark'),
            cell_code: Joi.string().trim().max(32).allow('', null).label('Cell Code'),
            valuation_type: Joi.string().trim().max(32).allow('', null).label('Valuation Type'),
            sku_reservation_1: Joi.string().trim().max(16).allow('', null).label('Sequence Aux'),
            code_relationship: Joi.array().items(GD_CODE_RELATIONSHIP_SCHEMA).label('QR Code Specification'),
            shelf_bin_list: Joi.array().items(SHELF_BIN_LIST_SCHEME).label('Shelf bin specification'),
          }),
        ),
        container_list: Joi.array().items(
          Joi.object().keys({
            container_code: Joi.string().trim().max(32).allow('', null).label('Container Code'),
            sku_amount: Joi.number().allow('', null).label('SKU Quantity'),
            sku_type_amount: Joi.number().allow('', null).label('Quantity of SKU Type'),
            creation_date: Joi.number().allow('', null).label('Creation Time'),
            workstation_no: Joi.string().trim().max(32).allow('', null).label('Workstation number'),
            seeding_bin_code: Joi.string().trim().max(32).allow('', null).label('Seeding bin code'),
            picker: Joi.string().trim().max(32).allow('', null).label('Picker'),
            sku_list: Joi.array().items(
              Joi.object().keys({
                sku_code: Joi.string().trim().max(64).required().label('SKU Code'),
                sku_level: Joi.number().integer().valid(0, 1).required().label('SKU Quality'),
                owner_code: Joi.string().trim().max(16).required().label('Owner Code'),
                amount: Joi.number().integer().required().label('Quantity'),
                item: Joi.number().allow('', null).label('Item'),
                sku_id: Joi.string().trim().max(32).allow('', null).label('SKU ID'),
                bar_code: Joi.string().trim().max(64).allow('', null).label('Bar Code'),
                is_sequence_sku: Joi.number().allow('', null).label('Is Sequence SKU Or Not'),
                sequence_no: Joi.string().trim().max(32).allow('', null).label('Sequence Number'),
                out_batch_code: Joi.string().trim().max(32).allow('', null).label('External Batch'),
                packing_spec: Joi.string().trim().max(16).allow('', null).label('Packing Specification'),
                remark: Joi.string().trim().max(64).allow('', null).label('Remark'),
                code_relationship: Joi.array().items(GD_CODE_RELATIONSHIP_SCHEMA).label('QR Code Specification'),
              })
            ).label('SKU Specification In Container'),
          })
        ).label('Goods Delivery Note’s Container'),
        package_list: Joi.array().items(
          Joi.object().keys({
            carrier_code: Joi.string().trim().max(16).allow('', null).label('Carrier Code'),
            children_waybill_code: Joi.string().trim().max(64).allow('', null).label('Children Waybill Code'),
            package_code: Joi.string().trim().max(32).allow('', null).label('Package Code'),
            weight: Joi.number().allow('', null).label('Weight'),
            materialCode: Joi.string().trim().max(32).allow('', null).label('Material Code'),
            materialName: Joi.string().trim().max(64).allow('', null).label('Material Name'),
            transition_code: Joi.string().trim().max(32).allow('', null).label('Handover Number'),
            sku_list: Joi.array().items(
              Joi.object().keys({
                sku_code: Joi.string().trim().max(64).allow('', null).label('SKU Code'),
                amount: Joi.number().allow('', null).label('Quantity'),
                sku_id: Joi.string().trim().max(64).allow('', null).label('SKU ID'),
              })
            ).label('Good Delivery Package Detail Information'),
          })
        ).label('Good Delivery Package Information'),
      }),
    ).min(1).required().label('Order List'),
  }).label('Body'),
});

const GR_CANCELLATION_SCHEMA = Joi.object().keys({
  receipt_amount: Joi.number().integer().min(1).required().label('Receipt Amount'),
  receipt_list: Joi.array().items(Joi.object().keys({
    receipt_code: Joi.string().trim().max(32).required().label('Goods Receipt Code'),
    warehouse_code: Joi.string().trim().max(16).required().label('Warehouse'),
    owner_code: Joi.string().trim().max(16).required().label('Goods Owner'),
    cancel_date: Joi.number().required().label('Cancel Time'),
    remark: Joi.string().trim().max(64).label('Remark'),
  })),
});

const POST_SCHEMA = Joi.object().keys({
  receipt_code: Joi.string().trim().max(32).required().label('Goods Receipt Code'),
  order_id: Joi.string().trim().max(20).label('Order ID'),
  order_type: Joi.string().trim().label('Order Type'),
  request: Joi.any(),
  direction: Joi.string().trim().lowercase().valid('in', 'out').default('in').label('Direction'),
  type: Joi.string().valid('create').required().label('Type'),
  payload: Joi.when(
    'direction', {
      is: 'in',
      then: GR_CREATION_SCHEMA,
      otherwise: GD_CREATION_SCHEMA,
    }
  ),
  status: Joi.number().integer().valid(0, 1, 2, 3, 4, 5).default(0).label('Status'),
  created_by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label('Created By'),
});

module.exports = {
  GD_CREATION_SCHEMA,
  GD_FEEDBACK_SCHEMA,
  GR_CANCELLATION_SCHEMA,
  GR_CREATION_SCHEMA,
  GR_FEEDBACK_SCHEMA,
  IR_RECONCILIATION_SCHEMA,
  POST_SCHEMA,
  SKU_SYNC_SCHEMA,
};
