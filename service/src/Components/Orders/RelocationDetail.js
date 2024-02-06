import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Skeleton, Result, Button, Table } from 'antd';
import OrderStatus from '../../Share/OrderStatus';
import OrderItems from './OrderItems';
//Hooks
import { INITIAL_WORKSTATION_STATE } from '../../Redux/reducers/app';
import { useNavigation } from '../../Hooks/Nav.hook';
import {
  useWorkstation,
  useClearWorkstation,
} from '../../Hooks/Workstation.hook';

import { getOrders } from '../../Services/API';
import { DICT_OP_CODE } from '../../Utils/operation_codes.js';

const RelocationDetail = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [{ orderDetail }, setWorkstation] = useWorkstation();
  const clearWorkstation = useClearWorkstation();
  const columns = [
    {
      title: 'Step No',
      dataIndex: 'created_at',
      render: (txt, row, index) => index + 1,
    },
    {
      title: 'Order ID',
      dataIndex: 'order_id',
    },
    {
      title: 'Type',
      dataIndex: 'type',
    },
  ];
  const [
    {
      query: { order_id },
    },
    nav,
  ] = useNavigation();
  useEffect(() => {
    async function findOrder() {
      setLoading(true);
      let response = await getOrders([
        {
          field: 'order_id',
          value: order_id,
        },
      ]);
      if (response.ok) {
        if (response?.data?.total > 0) {
          let relocationsResponse = await getOrders([
            {
              field: 'relocation',
              value: order_id,
            },
          ]);
          if (relocationsResponse.ok) {
            setWorkstation({
              ...INITIAL_WORKSTATION_STATE, //Set initial state
              orderDetail: {
                ...response.data?.data[0],
                relocation_steps: relocationsResponse.data?.data,
              },
            });
          }
        } else {
          setError(true);
        }
      }
      setLoading(false);
    }

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
          subTitle="Unknown Order Number"
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
              <Col span={8}>
                <h3>
                  {DICT_OP_CODE[orderDetail?.type]}: {orderDetail?.order_id}
                </h3>
              </Col>
              <Col span={8}>
                <h3 style={{ textTransform: 'uppercase' }}>Type: Relocation</h3>
              </Col>
              <Col span={8}>
                <h3 style={{ textTransform: 'uppercase' }}>
                  STATUS: {_renderStatus()}
                </h3>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={24} style={{ padding: 10 }}>
          <Table
            columns={columns}
            rowKey={row => row._id}
            dataSource={orderDetail?.relocation_steps}
            expandedRowRender={row => {
              return <OrderItems order_id={row.order_id} />;
            }}
          />
        </Col>
      </Row>
    </div>
  );
};
export default RelocationDetail;
