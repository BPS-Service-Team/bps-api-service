import React, { useEffect, useState } from 'react';
import { Skeleton, Result, Row, Col, Card, Button, Modal } from 'antd';
import { getPickZones, updatePickupZone } from '../../Services/API';
import { usePickupZones } from '../../Hooks/Workstation.hook';
const PickZonesManager = () => {
  const [pickZones, update] = usePickupZones();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    _handleUpdatePickupZones();
  }, []);
  const _handleUpdatePickupZones = async () => {
    setLoading(true);
    let response = await getPickZones([]);
    if (response.ok) {
      let tempPickupZone = pickZones;
      for (let zone of response.data.data) {
        for (let index in tempPickupZone) {
          if (pickZones[index].label === zone.label) {
            tempPickupZone = tempPickupZone.updateIn(index, row =>
              row.merge({
                status: zone.status,
                id: zone._id,
              })
            );
          }
        }
      }
      update(tempPickupZone);
    }
    setLoading(false);
  };
  const _handleReleasePickupZone = async id => {
    let response = await updatePickupZone(id, { status: 1 });
    if (response.ok) {
      _handleUpdatePickupZones();
    }
  };
  const _renderZones = () => {
    return pickZones.map(row => {
      if (row.status === 1) {
        return (
          <Col className="pick-zone-result large" key={row.label} span={12}>
            <h3>Pick Zone {row.label}</h3>
            <div>Empty</div>
          </Col>
        );
      }

      return (
        <Col
          className="pick-zone-result large danger"
          key={row.label}
          span={12}
        >
          <h3>Pick Zone {row.label}</h3>
          <div>Not Available</div>
          <div style={{ marginTop: 10 }}>
            <Button
              onClick={() =>
                Modal.confirm({
                  title: 'Do you want release this pickup zone?',
                  centered: true,
                  onOk: async () => {
                    await _handleReleasePickupZone(row.id);
                  },
                })
              }
            >
              Release
            </Button>
          </div>
        </Col>
      );
    });
  };
  if (loading) {
    return (
      <div className="pick-zone loading">
        <Skeleton active />
      </div>
    );
  }
  if (pickZones.length === 0) {
    return (
      <div className="pick-zones fadeIn">
        <Result status="warning" title="No Pickup zones available" />
      </div>
    );
  }
  return (
    <Card style={{ height: '100%' }} className="fadeIn">
      <div className="pick-zones ">
        <Row gutter={[30, 30]} justify="space-between">
          {_renderZones()}
        </Row>
      </div>
    </Card>
  );
};

export default PickZonesManager;
