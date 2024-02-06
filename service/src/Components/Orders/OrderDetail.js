import React, { useCallback, useState, useEffect } from 'react';
import { Button, Card, Row, Col, Skeleton, Result } from 'antd';
import OrderStatus from '../../Share/OrderStatus';
import OrderDetailsTable from './OrderDetailsTable';
//Hooks
import { INITIAL_WORKSTATION_STATE } from '../../Redux/reducers/app';
import { useNavigation } from '../../Hooks/Nav.hook';
import {
  useWorkstation,
  useClearWorkstation,
} from '../../Hooks/Workstation.hook';

import { getOrders, resendCall } from '../../Services/API';
import { DICT_OP_CODE } from '../../Utils/operation_codes.js';

const OrderDetail = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [{ orderDetail }, setWorkstation] = useWorkstation();
  const clearWorkstation = useClearWorkstation();
  const [
    {
      query: { order_id },
    },
    nav,
  ] = useNavigation();
  const findOrder = useCallback(async function () {
    setLoading(true);
    let response = await getOrders([
      {
        field: 'order_id',
        value: order_id,
      },
    ]);
    if (response.ok) {
      if (response?.data?.total > 0) {
        setWorkstation({
          ...INITIAL_WORKSTATION_STATE, //Set initial state
          orderDetail: response.data?.data[0],
        });
      } else {
        setError(true);
      }
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    if (order_id) {
      findOrder();
    }
    return () => {
      clearWorkstation();
    };
  }, [order_id]);
  const _renderStatus = () => {
    let status = OrderStatus.filter(row => row.id === orderDetail?.status);
    return status[0]?.title;
  };
  const _handleResendFeedback = async () => {
    setLoading(true);
    const oResponse = await resendCall('wms/send', orderDetail.order_id);
    setLoading(false);
    if (oResponse.ok) {
      findOrder();
    }
  };
  if (loading) {
    return (
      <div className="loading-content fadeIn">
        <Row gutter={[20, 20]}>
          <Col span={24}>
            <Card>
              <Skeleton active />
            </Card>
          </Col>
          <Col span={24}>
            <Card>
              <Skeleton active />
            </Card>
          </Col>
          <Col span={24}>
            <Card>
              <Skeleton active />
            </Card>
          </Col>
          <Col span={24}>
            <Card>
              <Skeleton active />
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
  if (error) {
    return (
      <Card className="order-detail fadeIn">
        <Result
          status="error"
          title="Order Not found"
          subTitle="Unknow Order Number"
          extra={
            <Button type="primary" onClick={() => nav('/')}>
              Go Home
            </Button>
          }
        />
      </Card>
    );
  }
  return (
    <div className="order-detail fadeIn">
      <Row>
        <Col span={24}>
          <Card style={{ borderBottom: 0 }}>
            <Row justify="space-between">
              <Col span={12}>
                <h3>
                  {DICT_OP_CODE[orderDetail?.type]}: {orderDetail?.order_id}
                </h3>
              </Col>
              <Col span={8}>
                <h3 style={{ textTransform: 'uppercase' }}>
                  STATUS: {_renderStatus()}
                </h3>
              </Col>
              {orderDetail?.pending_feedback && (
                <Col span={4}>
                  <Button onClick={_handleResendFeedback} type="primary">
                    Resend WMS Feedback
                  </Button>
                </Col>
              )}
            </Row>
          </Card>
        </Col>
        <Col span={24}>
          <OrderDetailsTable
            type={orderDetail?.type}
            details={orderDetail?.agf}
            title="AGF"
          />
        </Col>
        <Col span={24}>
          <OrderDetailsTable
            type={orderDetail?.type}
            details={orderDetail?.agv}
            title="AGV"
          />
        </Col>
      </Row>
    </div>
  );
};
export default OrderDetail;
