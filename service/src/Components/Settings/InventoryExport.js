import React, { useState } from 'react';
import { Card, Row, Button, Col } from 'antd';
import { exportCSV } from '../../Utils/export';

import { getInventoryOperation } from '../../Services/API';
const InventoryExport = () => {
  const [loading, setLoading] = useState(false);
  const _normalizeItems = items => {
    let aTmp = [];
    for (let i of items) {
      aTmp.push({
        'Stock No.': i.STOCK_NO,
        'Pack Key': i.PACK_KEY,
        'Item Name': i.ITM_NAME,
        'Batch No.': i.BATCH_NO,
        'Val Type': i.VAL_TYPE,
        'Serial No': i.SERIAL_NO,
        PROJ_SEG: i.PROJ_SEG,
        VEND_SEG: i.VEND_SEG,
        WES_LOC: i.WES_LOC,
        BAL_QTY: i.BAL_QTY,
      });
    }
    return aTmp;
  };
  const _handleExportInventory = async () => {
    setLoading(true);
    let response = await getInventoryOperation();
    if (response.ok) {
      //Process data with csv
      exportCSV(_normalizeItems(response.data.SB_LIST), 'INVENTORY OPERATION');
    }
    setLoading(false);
  };
  return (
    <Card>
      <Row
        justify="center"
        style={{ minHeight: 300, alignItems: 'center' }}
        align="center"
      >
        <Col>
          <Button
            onClick={_handleExportInventory}
            loading={loading}
            type="primary"
          >
            Download Inventory Operation
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

export default InventoryExport;
