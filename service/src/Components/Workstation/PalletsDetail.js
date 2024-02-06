import React, { useState } from 'react';
import { Card, Row, Col, Button, Modal, Input } from 'antd';
import PalletsTable from './PalletsTable';
//Hooks
import { useNavigation } from '../../Hooks/Nav.hook';
import { usePallets } from '../../Hooks/Workstation.hook';
//Services
import { scanPallet } from '../../Services/API';
const PalletsDetail = () => {
  const [palletIdModal, setPalletIdModal] = useState(false);
  const [palleteModalLoading, setPaletteModalLoading] = useState(false);
  const [
    {
      query: { order_id },
    },
  ] = useNavigation();
  const [inputTxt, setInputTxt] = useState('');
  const [pallets, setPallets] = usePallets();
  const _handleSetPallet = async () => {
    setPaletteModalLoading(true);
    let response = await scanPallet({
      order_id,
      pallet_id: inputTxt,
      operation: 'reserve',
    });
    if (response.ok) {
      setPallets([
        ...pallets,
        {
          pallet_id: inputTxt,
          ...response.data.data,
        },
      ]);
      setInputTxt('');
      setPalletIdModal(false);
    }
    setPaletteModalLoading(false);
  };
  const _keyListener = e => {
    if (e.key === 'Enter') {
      _handleSetPallet();
    }
  };
  return (
    <Card className="pallets-detail">
      <Modal
        title="Scan Pallet ID"
        visible={palletIdModal}
        onCancel={() => setPalletIdModal(false)}
        centered
        destroyOnClose
        okButtonProps={{ loading: palleteModalLoading }}
        okText="Set Pallet"
        onOk={_handleSetPallet}
      >
        <Input
          autoFocus
          placeholder="Enter or scan pallet ID"
          value={inputTxt}
          onKeyDown={_keyListener}
          onChange={e => setInputTxt(e.target.value)}
        />
      </Modal>
      <Row justify="space-between">
        <Col span={12}>
          <h3 style={{ textAlign: 'left' }}>Pallets Detail</h3>
        </Col>
        <Col span={12}>
          <Row justify="end" gutter={[10]}>
            <Col>
              <Button type="primary" onClick={() => setPalletIdModal(true)}>
                Pallet ID
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
      <PalletsTable />
    </Card>
  );
};

export default PalletsDetail;
