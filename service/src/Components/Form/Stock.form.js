import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Col, Form, Input, Row, Select, Button } from 'antd';
import { getStocks } from '../../Services/API';
let timeout;
const StockForm = ({ formRef, onSubmit, add = false, status, ...props }) => {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState({});
  const [selectedLabel, setSelectedLabel] = useState('');
  const _handleFindStock = async location => {
    timeout = null;
    clearTimeout(timeout);
    setSelectedLabel(location);
    timeout = setTimeout(async () => {
      let response = await getStocks([
        {
          field: 'label[$regex]',
          value: location,
        },
      ]);
      if (response.ok) {
        setStocks(response.data?.data);
      }
    });
  };
  const _handleSelectLocation = value => {
    let row = stocks.find(record => record?.label === value);
    if (row !== null && row !== undefined) {
      if (row?.pallet_id) {
        formRef.setFieldsValue({
          label: row.label,
          pallet_id: row?.pallet_id,
        });
      } else {
        formRef.setFieldsValue({
          label: row.label,
        });
      }
      setSelectedLabel(value);
    }
    setSelectedStock(row);
  };
  const _handleClearLocation = () => {
    setSelectedStock({});
    setStocks([]);
    if (selectedStock?.pallet_id) {
      formRef.setFieldsValue({
        label: '',
        pallet_id: '',
      });
    } else {
      formRef.setFieldsValue({
        label: '',
      });
    }
    setSelectedLabel('');
  };

  if (add) {
    return (
      <Form form={formRef} onFinish={onSubmit} layout="vertical" {...props}>
        <Form.Item noStyle name="label">
          <Input style={{ display: 'none' }} />
        </Form.Item>
        <Row gutter={[10, 10]}>
          <Col md={12}>
            <Form.Item label="Location">
              <Select
                style={{ width: '100%' }}
                placeholder="Search location"
                showSearch
                value={selectedLabel}
                onSearch={_handleFindStock}
                onChange={_handleSelectLocation}
                notFoundContent={null}
              >
                {stocks.map(row => (
                  <Select.Option value={row.label} key={row._id}>
                    {row.label}
                  </Select.Option>
                ))}
              </Select>
              {selectedStock._id && (
                <div style={{ textAlign: 'right', marginTop: 5 }}>
                  <Button onClick={_handleClearLocation}>Clear</Button>
                </div>
              )}
            </Form.Item>
          </Col>
          <Col md={12}>
            <Form.Item
              label="Pallet ID"
              name="pallet_id"
              rules={[{ required: true, message: 'This field is required!' }]}
            >
              <Input disabled={selectedStock.pallet_id} />
            </Form.Item>
          </Col>
          <Col md={8}>
            <Form.Item
              label="Stock Number"
              name="stock_no"
              rules={[{ required: true, message: 'This field is required!' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col md={8}>
            <Form.Item label="Batch No" name="batch_no">
              <Input />
            </Form.Item>
          </Col>
          <Col md={8}>
            <Form.Item label="Pack Key" name="pack_key">
              <Input />
            </Form.Item>
          </Col>
          <Col md={8}>
            <Form.Item label="Quantity" name="qty">
              <Input />
            </Form.Item>
          </Col>
          <Col md={8}>
            <Form.Item label="Val Type" name="val_type">
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Reason" name="reason">
              <Input.TextArea />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Remarks" name="remark">
              <Input.TextArea />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  }

  return (
    <Form form={formRef} onFinish={onSubmit} layout="vertical" {...props}>
      <Form.Item noStyle shouldUpdate>
        {() => {
          if (status === 202) {
            return (
              <Form.Item label="Status" name="status">
                <Select style={{ width: '100%' }}>
                  <Select.Option value={202}>202 In transit</Select.Option>
                  <Select.Option value={201}>201 Ready</Select.Option>
                </Select>
              </Form.Item>
            );
          }
        }}
      </Form.Item>
      <Row gutter={[10, 10]}>
        <Col md={12}>
          <Form.Item label="Batch No" name="batch_no">
            <Input />
          </Form.Item>
        </Col>
        <Col md={6}>
          <Form.Item label="Quantity" name="qty">
            <Input />
          </Form.Item>
        </Col>
        <Col md={6}>
          <Form.Item label="Val Type" name="val_type">
            <Input />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item label="Reason" name="reason">
            <Input.TextArea />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item label="Remarks" name="remark">
            <Input.TextArea />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

StockForm.propTypes = {
  formRef: PropTypes.any,
  onSubmit: PropTypes.func,
  add: PropTypes.bool,
};

export default StockForm;
