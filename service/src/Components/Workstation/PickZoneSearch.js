import React, { useState } from 'react';
import { Input, Button, message, Row, Col } from 'antd';
import PickZones from './PickZones';
import { useWorkstation } from '../../Hooks/Workstation.hook';
import { updatePickupZone } from '../../Services/API';
const PickZoneSearch = ({
  inModal = false,
  modalHandler,
  picking = false,
  pallet_id,
  autoFocus = true,
  disableComponents = false,
}) => {
  const [loading, setLoading] = useState();
  const [inputTxt, setInputTxt] = useState('');
  const [{ pickup, pickZones, workstationId, orderDetail }, update] =
    useWorkstation();
  const _onFind = async () => {
    setLoading(true);
    if (pickup) {
      message.error(`The Pick Zone ${pickup.label} is already selected`);
      setLoading(false);
      setInputTxt('');
      return;
    }
    let found = false;
    for (let index in pickZones) {
      if (
        pickZones[index].label.includes(inputTxt) &&
        workstationId === pickZones[index].workstation
      ) {
        found = true;
        if (pickZones[index].status === 0) {
          message.error('Pick zone not available');
        } else {
          let response;
          if (picking) {
            response = await updatePickupZone(pickZones[index].id, {
              status: 2,
              pallet_id,
              order_id: orderDetail.order_id,
            });
          } else {
            response = await updatePickupZone(pickZones[index].id, {
              status: 2,
            });
          }
          if (response.ok) {
            if (picking) {
              modalHandler(false);
              update({
                pickup: {
                  id: response.data._id,
                  label: response.data.label,
                },
                pickZones: pickZones.updateIn([index], row =>
                  row.merge({ status: 2 })
                ),
                pending: response.data.agf_task,
              });
            } else {
              update({
                pickup: {
                  id: response.data._id,
                  label: response.data.label,
                },
                pickZones: pickZones.updateIn([index], row =>
                  row.merge({ status: 2 })
                ),
              });
            }

            setInputTxt('');
          }
        }
      }
    }
    if (!found) {
      message.error('Pick Zone not found in the current workstation');
    }
    setLoading(false);
  };
  const _keyListener = e => {
    if (e.key === 'Enter') {
      _onFind();
    }
  };
  //TODO disable button when a pickup is selected
  if (inModal) {
    return (
      <Row justify="end" gutter={[10, 10]}>
        <Col span={24}>
          <Input
            autoFocus
            placeholder="Please scan or input Pick zone ID"
            value={inputTxt}
            onChange={e => setInputTxt(e.target.value)}
            onKeyDown={_keyListener}
            disabled={
              orderDetail?.status === 3 ||
              orderDetail?.status === 4 ||
              orderDetail?.cancelled
            }
          />
        </Col>
        <Col span={24}>
          <PickZones />
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            loading={loading}
            onClick={_onFind}
            disabled={!inputTxt}
          >
            Determine
          </Button>
        </Col>
      </Row>
    );
  }
  return (
    <div className="pick-zone-search">
      <div className="input-container">
        <Input
          autoFocus={autoFocus}
          placeholder="Please scan or input Pick zone ID"
          value={inputTxt}
          onChange={e => setInputTxt(e.target.value)}
          onKeyDown={_keyListener}
          disabled={
            orderDetail?.status === 3 ||
            orderDetail?.status === 4 ||
            orderDetail?.cancelled
          }
        />
        <Button
          type="primary"
          loading={loading}
          onClick={_onFind}
          disabled={disableComponents ? disableComponents : !inputTxt}
        >
          Determine
        </Button>
      </div>
    </div>
  );
};

export default PickZoneSearch;
