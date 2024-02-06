import React from 'react';
import PropTypes from 'prop-types';
import { Table, Card, Row, Col } from 'antd';
import OrderActions from './OrderActions';

import { useWorkstation } from '../../Hooks/Workstation.hook';

const OrderDetailsTable = ({ details = [] }) => {
  const [{ items, pallet }] = useWorkstation();
  const columns = [
    {
      title: 'Line No.',
      dataIndex: 'GR_CODE',
      render(txt, row, index) {
        return index + 1;
      },
    },
    {
      title: 'Stk No.',
      dataIndex: 'STOCK_NO',
    },
    {
      title: 'Item Name',
      dataIndex: 'ITM_NAME',
    },
    {
      title: 'Batch No.',
      dataIndex: 'BATCH_NO',
    },
    {
      title: 'Val Type',
      dataIndex: 'VAL_TYPE',
    },
    {
      title: 'PA QTY (Sug)',
      dataIndex: 'SUG_PA_QTY',
    },
    {
      title: 'Pa QTY',
      dataIndex: 'PA_QTY',
      render(txt) {
        return txt || 0;
      },
    },
    {
      title: 'Pallet Qty',
      dataIndex: 'pallet_qty',
      render(txt, row) {
        for (let item of items) {
          if (
            item.STOCK_NO === row.STOCK_NO &&
            item.BATCH_NO === row.BATCH_NO &&
            item.PACK_KEY === row.PACK_KEY &&
            item.VAL_TYPE === row.VAL_TYPE
          ) {
            return item.QTY;
          }
        }
        return txt || 0;
      },
    },
  ];
  return (
    <Card>
      <Row justify="space-between">
        <Col>
          <h3 style={{ textAlign: 'left' }}>
            Order Details. {pallet?.id && `Pallet: ${pallet.id}`}
          </h3>
        </Col>
        <Col>
          <OrderActions />
        </Col>
      </Row>

      <div className="fluid-container">
        <Table
          columns={columns}
          dataSource={details}
          rowKey={row => `${row.STOCK_NO}-${row.BATCH_NO}-${row.VAL_TYPE}`}
        />
      </div>
    </Card>
  );
};
OrderDetailsTable.propTypes = {
  details: PropTypes.array,
};
export default OrderDetailsTable;
