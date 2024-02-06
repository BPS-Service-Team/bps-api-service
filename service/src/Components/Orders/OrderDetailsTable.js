import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Table, Card, Row, Col } from 'antd';

const OrderDetailsTable = ({
  type = '',
  details = [],
  title = '',
  loading = false,
}) => {
  const [index, setIndex] = useState(1);
  const columns = [
    {
      title: 'Line No.',
      dataIndex: type === 'picking' ? 'DOD_SEQ' : 'GRD_SEQ',
      render: (txt, row, i) => (index - 1) * 10 + i + 1,
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
      title: type === 'picking' ? 'PICK QTY (Sug)' : 'PA QTY (Sug)',
      dataIndex: type === 'picking' ? 'SUG_PICK_QTY' : 'SUG_PA_QTY',
    },
    {
      title: type === 'picking' ? 'PICK QTY' : 'Pa QTY',
      dataIndex: type === 'picking' ? 'PICK_QTY' : 'PA_QTY',
      render(txt) {
        return txt || 0;
      },
    },
  ];

  return (
    <Card style={{ borderBottom: 0 }}>
      <Row justify="space-between">
        <Col>
          <h3 style={{ textAlign: 'left' }}>Order Details {title}</h3>
        </Col>
      </Row>

      <div className="fluid-container">
        <Table
          columns={columns}
          loading={loading}
          dataSource={details}
          pagination={{
            current: index,
            onChange: e => setIndex(e),
          }}
          rowKey={row =>
            row.STOCK_NO +
            row.PA_QTY +
            row.VAL_TYPE +
            row.BATCH_NO +
            row.ITM_NAME +
            row.DOD_SEQ +
            Math.random()
          }
        />
      </div>
    </Card>
  );
};
OrderDetailsTable.propTypes = {
  details: PropTypes.array,
};
export default OrderDetailsTable;
