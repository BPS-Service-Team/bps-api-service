import React, { useEffect, useState } from 'react';
import { Skeleton, Result, Row, Col, Button } from 'antd';
import { getPickZones } from '../../Services/API';
import {
  useWorkstationId,
  usePickupZones,
  useWorkstation,
} from '../../Hooks/Workstation.hook';
const PickZones = ({ picking, loadingHandler = () => ({}) }) => {
  const [workstationId] = useWorkstationId();
  const [
    { currentStocks, pending, picking: oPicking, taskResult },
    setWorkStation,
  ] = useWorkstation();
  const [pickZones, update] = usePickupZones();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    async function get() {
      setLoading(true);
      loadingHandler(true);
      let response = await getPickZones([
        {
          field: 'status',
          value: 1,
        },
      ]);
      if (response.ok) {
        let tempPickupZone = pickZones;
        for (let zone of response.data.data) {
          for (let index in tempPickupZone) {
            if (pickZones[index].label === zone.label) {
              tempPickupZone = tempPickupZone.updateIn(index, row =>
                row.merge({
                  status: 1,
                  id: zone._id,
                })
              );
            }
          }
        }
        update(tempPickupZone);
      }
      setLoading(false);
      loadingHandler(false);
    }
    get();
  }, [workstationId]);
  const _renderZones = () => {
    let zones = [];
    if (workstationId === '1') {
      zones = pickZones.slice(0, 2);
    } else {
      zones = pickZones.slice(2, 4);
    }

    return zones.map(row => {
      if (row.status === 1) {
        return (
          <Col className="pick-zone-result" key={row.label}>
            <h3>Pick Zone {row.label}</h3>
            <div>Empty</div>
          </Col>
        );
      }
      if (row.status === 2) {
        if (taskResult !== null) {
          if (
            taskResult[row.label]?.status !== 4 &&
            taskResult[row.label]?.status !== 5 &&
            taskResult[row.label]?.status !== 6
          ) {
            const sTaskNo = taskResult[row.label]?.task_no;
            const oCurrentPickup = oPicking?.find(
              oItem => oItem.task?.task_no === sTaskNo
            );
            if (taskResult[row.label]?.direction === 'in') {
              return (
                <Col className="pick-zone-result info" key={row.label}>
                  <h3>Pick Zone {row.label}</h3>
                  <div>In use</div>
                  <div>
                    Returning Pallet to{' '}
                    {taskResult[row.label]?.location_destination}
                  </div>
                  <span>{taskResult[row.label]?.task_no}</span>
                  {oCurrentPickup && (
                    <div>Pallet: {oCurrentPickup.pallet_id}</div>
                  )}
                </Col>
              );
            }
            return (
              <Col className="pick-zone-result info" key={row.label}>
                <h3>Pick Zone {row.label}</h3>
                <div>Waiting for robot</div>
                {oCurrentPickup && (
                  <div>Pallet: {oCurrentPickup.pallet_id}</div>
                )}
              </Col>
            );
          }
          if (
            taskResult[row.label] &&
            taskResult[row.label]?.location_destination === row.label &&
            picking
          ) {
            if (
              taskResult[row.label]?.status === 4 ||
              taskResult[row.label]?.status === 5
            ) {
              let sPallet;
              const nIndex = oPicking.findIndex(
                oItem => !oItem.ready && oItem.workstation_id === row.label
              );
              if (nIndex > -1) {
                sPallet = oPicking[nIndex].pallet_id;
              }
              const sTaskNo = taskResult[row.label]?.task_no;
              const oCurrentPickup = oPicking.find(
                oItem => oItem.task_no === sTaskNo
              );
              return (
                <Col className="pick-zone-result info" key={row.label}>
                  <h3>Pick Zone {row.label}</h3>
                  <div>In use</div>
                  {sPallet && <div>{sPallet}</div>}
                  <Button
                    onClick={() => {
                      setWorkStation({
                        palletModalView: true,
                        currentPickupZone: row.label,
                      });
                    }}
                  >
                    Start
                  </Button>
                  {oCurrentPickup && (
                    <div>Pallet: {oCurrentPickup.pallet_id}</div>
                  )}
                </Col>
              );
            } else if (taskResult[row.label]?.status === 6) {
              let sPallet;
              const nIndex = oPicking.findIndex(
                oItem => !oItem.ready && oItem.workstation_id === row.label
              );
              if (nIndex > -1) {
                sPallet = oPicking[nIndex].pallet_id;
              }
              return (
                <Col className="pick-zone-result info" key={row.label}>
                  <h3>Pick Zone {row.label}</h3>
                  <div>Task ends with an error</div>
                  <div className="multi-buttons">
                    <Button
                      onClick={() => {
                        let oCurrentStocks = { ...currentStocks };
                        oCurrentStocks[sPallet] = undefined;
                        oCurrentStocks = JSON.parse(
                          JSON.stringify(oCurrentStocks)
                        );
                        setWorkStation({
                          currentStocks: oCurrentStocks,
                          errorTask: taskResult[row.label]?.error,
                          retry: true,
                        });
                      }}
                    >
                      Retry
                    </Button>
                    <Button
                      onClick={() => {
                        setWorkStation({
                          palletModalView: true,
                          currentPickupZone: row.label,
                        });
                      }}
                    >
                      Show Details
                    </Button>
                  </div>
                </Col>
              );
            }
          }
        }

        return (
          <Col className="pick-zone-result info" key={row.label}>
            <h3>Pick Zone {row.label}</h3>
            <div>Waiting for robot</div>
            {!pending && <div>Finish</div>}
          </Col>
        );
      }
      return (
        <Col className="pick-zone-result danger" key={row.label}>
          <h3>Pick Zone {row.label}</h3>
          <div>Not Available</div>
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
    <div className="pick-zones fadeIn">
      <Row gutter={[20, 20]} justify="space-between">
        {_renderZones()}
      </Row>
    </div>
  );
};

export default PickZones;
