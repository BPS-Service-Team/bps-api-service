import React from 'react';
import { Row, Col, Card } from 'antd';
import PickZones from './PickZones';
import PickingActions from './PickingActions';
import PickingTable from './PickingTable';
import OrderStatus from '../../Share/OrderStatus';

import { useWorkstation } from '../../Hooks/Workstation.hook';
const PickingDetail = () => {
  const [{ orderDetail, picking }] = useWorkstation();

  const _renderStatus = () => {
    let status = OrderStatus.filter(row => row.id === orderDetail?.status);
    return status[0]?.title;
  };
  return (
    <div className="order-detail picking-detail fadeIn">
      <Row gutter={[10, 10]}>
        <Col span={24}>
          <PickingActions />
        </Col>
        <Col span={24}>
          <Card>
            <Row justify="space-between">
              <Col span={12}>
                <h3>DRCODE: {orderDetail?.order_id}</h3>
              </Col>
              <Col span={12}>
                <h3 style={{ textTransform: 'uppercase' }}>
                  STATUS: {_renderStatus()}
                </h3>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={24}>
          <PickingTable items={picking} />
        </Col>
        <Col span={24}>
          <Card>
            <PickZones picking />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PickingDetail;
