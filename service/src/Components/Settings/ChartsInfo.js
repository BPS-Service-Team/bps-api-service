import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Skeleton } from 'antd';
import OrdersChart from '../Charts/OrdersChart';
import OrdersStatusChart from '../Charts/OrderStatusChart';
import OrderDailyChart from '../Charts/OrderDailyChart';
import { getChartsData } from '../../Services/API';
const ChartsInfo = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function getData() {
      let response = await getChartsData();
      if (response.ok) {
        setData(response.data);
      }
      setLoading(false);
    }
    getData();
  }, []);
  if (loading) {
    return (
      <Card>
        <Row gutter={[10, 10]}>
          <Col span={24}>
            <Skeleton active />
          </Col>
          <Col span={12}>
            <Skeleton active />
          </Col>
          <Col span={12}>
            <Skeleton active />
          </Col>
        </Row>
      </Card>
    );
  }
  return (
    <Card className="container" style={{ height: '100%' }}>
      <Row gutter={[10, 10]}>
        <Col span={24}>
          <OrdersChart data={data.dates} />
        </Col>
        <Col span={12}>
          <OrdersStatusChart data={data.status} />
        </Col>
        <Col span={12}>
          <OrderDailyChart data={data.dailyGroup} />
        </Col>
      </Row>
    </Card>
  );
};

export default ChartsInfo;
