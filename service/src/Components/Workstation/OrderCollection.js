import React from 'react';
import { Row, Col } from 'antd';
import OrderSearch from './OrderSearch';
import AgfTable from './AgfTable';
const OrderCollection = () => {
  return (
    <div className="order-collection">
      <Row>
        <Col span={24}>
          <OrderSearch />
        </Col>
        <Col span={24}>
          <AgfTable />
        </Col>
      </Row>
    </div>
  );
};

export default OrderCollection;
