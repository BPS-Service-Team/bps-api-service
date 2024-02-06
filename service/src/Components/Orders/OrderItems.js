import React, { useState, useEffect } from 'react';
import { Row, Col } from 'antd';
import OrderDetailsTable from './OrderDetailsTable';
import { getOrders } from '../../Services/API';

const OrderItems = ({ order_id }) => {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    async function get() {
      setLoading(true);
      let response = await getOrders([
        {
          field: 'order_id',
          value: order_id,
        },
      ]);
      if (response.ok) {
        if (response.data.data?.length > 0) {
          setData(response.data.data[0]);
        }
      }
      setLoading(false);
    }
    if (order_id) {
      get();
    }
  }, [order_id]);
  return (
    <div className="order-items">
      <Row>
        <Col span={24}>
          <OrderDetailsTable
            type={data?.type}
            details={data?.agf}
            title="AGF"
            loading={loading}
          />
        </Col>
        <Col span={24}>
          <OrderDetailsTable
            type={data?.type}
            details={data?.agv}
            title="AGV"
            loading={loading}
          />
        </Col>
      </Row>
    </div>
  );
};

export default OrderItems;
