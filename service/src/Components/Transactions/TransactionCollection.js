import React from 'react';
import { Row, Col } from 'antd';
import TransactionTable from './TransactionTable';
const TransactionCollection = () => {
  return (
    <div className="order-collection">
      <Row gutter={[20, 20]}>
        <Col span={24}>
          <TransactionTable />
        </Col>
      </Row>
    </div>
  );
};

export default TransactionCollection;
