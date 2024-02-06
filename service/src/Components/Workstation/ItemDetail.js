import { Card, Col, Radio, Row, Skeleton } from 'antd';
import React, { useEffect, useState } from 'react';
import PickZoneSearch from './PickZoneSearch';
import PickZones from './PickZones';
//Hooks
import { useWorkstationId } from '../../Hooks/Workstation.hook';

const ItemDetail = ({ disableComponents = false }) => {
  const [loading] = useState(false);
  const [workstationLoading, setWorkstationLoading] = useState(false);
  const [workstationIdVal, setWorkstationIdVal] = useState('1');
  const [workstationId, setWorkstationId] = useWorkstationId();

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
            <PickZoneSearch
              disableComponents={disableComponents}
              autoFocus={false}
            />
            <PickZones loadingHandler={setWorkstationLoading} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
export default ItemDetail;
