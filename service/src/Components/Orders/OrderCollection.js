import React from 'react';
import { Row, Col } from 'antd';
import OrderTable from './OrderTable';
const OrderCollection = () => {
  return (
    <div className="order-collection">
      <Row gutter={[20, 20]}>
        <Col span={24}>
          <OrderTable />
        </Col>
      </Row>
    </div>
  );
};

export default OrderCollection;
