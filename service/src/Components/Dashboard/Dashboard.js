import React from 'react';
import { Row, Col } from 'antd';
import AgfPendingOrdersTable from './AgfPendingOrdersTable';
import AgvPendingOrdersTable from './AgvPendingOrdersTable';
const Dashboard = () => {
  return (
    <div className="order-collection">
      <Row gutter={[20, 20]}>
        <Col span={24}>
          <AgfPendingOrdersTable />
        </Col>
        <Col span={24}>
          <AgvPendingOrdersTable />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
