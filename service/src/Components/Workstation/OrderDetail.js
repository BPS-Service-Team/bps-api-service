import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Skeleton, Radio, Result, Button, Modal } from 'antd';
import { useDispatch } from 'react-redux';
import PickZoneSearch from './PickZoneSearch';
import PickingDetail from './PickingDetail';
import OrderStatus from '../../Share/OrderStatus';
import PickZones from './PickZones';
import OrderDetailsTable from './OrderDetailsTable';
//Hooks
import { INITIAL_WORKSTATION_STATE } from '../../Redux/reducers/app';
import { useNavigation } from '../../Hooks/Nav.hook';
import {
  useWorkstationId,
  useWorkstation,
  useClearWorkstation,
} from '../../Hooks/Workstation.hook';
import { getOrders, calculatePicking } from '../../Services/API';
import { Error } from '../../Redux/reducers/error';

const OrderDetail = () => {
  const [loading, setLoading] = useState(false);
  const [workstationLoading, setWorkstationLoading] = useState(false);
  const [error, setError] = useState(false);
  const [{ orderDetail }, setWorkstation] = useWorkstation();
  const [workstationIdVal, setWorkstationIdVal] = useState('1');
  const [workstationId, setWorkstationId] = useWorkstationId();
  const clearWorkstation = useClearWorkstation();
  const [
    {
      query: { order_id },
    },
    nav,
  ] = useNavigation();
  useEffect(() => {
    if (workstationId !== workstationIdVal) {
      let timeoutId;
      timeoutId = setTimeout(() => {
        setWorkstationId(workstationIdVal);
      }, 1000);
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [workstationIdVal]);
  useEffect(() => {
    let popHandler = () => {
      if (
        // eslint-disable-next-line no-alert
        confirm(
          'Please by aware of performing this action will loose the operation. If you wish to go back click cancel button'
        )
      ) {
        window.history.back();
      } else {
        window.history.forward();
        setTimeout(() => {
          window.addEventListener('popstate', popHandler, { once: true });
        }, 50);
      }
    };
    window.addEventListener('popstate', popHandler, { once: true });
    window.history.pushState(null, null, null);
    window.onbeforeunload = function () {
      return 'Please by aware of performing this action will loose the operation. If you wish to go back click cancel button';
    };
    return () => {
      window.addEventListener('popstate', () => ({}), { once: true });
    };
  }, []);
  const dispatch = useDispatch();

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
          let order = response.data?.data[0];
          if (order?.type === 'picking' && order?.status < 3) {
            let responsePick = await calculatePicking(order_id);
            if (response.ok) {
              if (responsePick.data?.errno === 0) {
                setWorkstation({
                  ...INITIAL_WORKSTATION_STATE, //Set initial state
                  orderDetail: response.data?.data[0],
                  picking: responsePick.data?.data,
                });
              } else if (responsePick.data?.errno === 2) {
                Modal.confirm({
                  title: 'Alert',
                  cancelText: 'No',
                  content: `There is not enought quantity for line items. Do you want to continue?`,
                  okText: 'Yes',
                  onCancel: () =>
                    nav('/dashboard/agf-workstation?step=order-collection'),
                  onOk: async () => {
                    setWorkstation({
                      ...INITIAL_WORKSTATION_STATE, //Set initial state
                      orderDetail: response.data?.data[0],
                      picking: responsePick.data?.data,
                    });
                  },
                });
              } else if (responsePick.data?.errno === 3) {
                Modal.confirm({
                  title: 'Alert',
                  cancelText: 'No',
                  content: `One of the items is not in stock. Do you want to continue?`,
                  okText: 'Yes',
                  onCancel: () =>
                    nav('/dashboard/agf-workstation?step=order-collection'),
                  onOk: async () => {
                    setWorkstation({
                      ...INITIAL_WORKSTATION_STATE, //Set initial state
                      orderDetail: response.data?.data[0],
                      picking: responsePick.data?.data,
                    });
                  },
                });
              } else {
                dispatch(Error.errorSet(responsePick));
              }
            }
          } else {
            setWorkstation({
              ...INITIAL_WORKSTATION_STATE, //Set initial state
              orderDetail: response.data?.data[0],
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
  if (orderDetail?.type === 'picking') {
    return <PickingDetail orderDetail={orderDetail} />;
  }
  return (
    <div className="order-detail fadeIn">
      <Row gutter={[10, 10]}>
        <Col span={24}>
          <Row
            gutter={[10, 0]}
            style={{ paddingTop: 10 }}
            justify="end"
            align="middle"
          >
            <Col>
              <h3>Workstation ID</h3>
            </Col>
            <Col>
              <Radio.Group
                options={[
                  {
                    label: '1',
                    value: '1',
                  },
                  {
                    label: '2',
                    value: '2',
                  },
                ]}
                value={workstationIdVal}
                onChange={e => setWorkstationIdVal(e.target.value)}
                optionType="button"
                disabled={workstationLoading}
                buttonStyle="solid"
              />
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <Card>
            <Row justify="space-between">
              <Col span={12}>
                <h3>GRCODE: {orderDetail?.order_id}</h3>
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
          <Card>
            <PickZoneSearch />
            <PickZones loadingHandler={setWorkstationLoading} />
          </Card>
        </Col>
        <Col span={24}>
          <OrderDetailsTable details={orderDetail?.agf} />
        </Col>
      </Row>
    </div>
  );
};
export default OrderDetail;
