import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input, Select, Row, Col } from 'antd';
const ItemMasterForm = ({ formRef, onSubmit, ...props }) => {
  return (
    <Form form={formRef} onFinish={onSubmit} layout="vertical" {...props}>
      <Row gutter={[10, 10]} justify="space-between">
        <Col md={8} sm={12}>
          <Form.Item
            label="Item Name"
            name="itm_name"
            rules={[{ required: true, message: 'This field is required!' }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col md={8} sm={12}>
          <Form.Item
            label="Stock No"
            name="stock_no"
            rules={[{ required: true, message: 'This field is required!' }]}
          >
            <Input disabled />
          </Form.Item>
        </Col>
        <Col md={8}>
          <Form.Item label="UOM" name="uom">
            <Input />
          </Form.Item>
        </Col>
        <Col md={6} sm={8}>
          <Form.Item label="Length" name="length">
            <Input />
          </Form.Item>
        </Col>
        <Col md={6} sm={8}>
          <Form.Item label="Height" name="height">
            <Input />
          </Form.Item>
        </Col>
        <Col md={6} sm={8}>
          <Form.Item label="Width" name="width">
            <Input />
          </Form.Item>
        </Col>
        <Col md={6} sm={8}>
          <Form.Item label="CBM" name="cbm">
            <Input />
          </Form.Item>
        </Col>
        <Col md={8} sm={8}>
          <Form.Item label="Gross Weight" name="gross_weight">
            <Input />
          </Form.Item>
        </Col>
        <Col md={8} sm={12}>
          <Form.Item label="Min Stk Lv AGV" name="min_stock_lv_agv">
            <Input />
          </Form.Item>
        </Col>
        <Col md={8} sm={12}>
          <Form.Item label="Min Stk Lv AGF" name="min_stock_lv_agf">
            <Input />
          </Form.Item>
        </Col>
        <Col md={8} sm={12}>
          <Form.Item label="Status" name="status">
            <Select>
              <Select.Option value={1}>Active</Select.Option>
              <Select.Option value={0}>Disabled</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col md={8} sm={12}>
          <Form.Item label="Sku Category" name="sku_category">
            <Select>
              <Select.Option value={0}>A</Select.Option>
              <Select.Option value={1}>B</Select.Option>
              <Select.Option value={2}>C</Select.Option>
              <Select.Option value={3}>D</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col md={8} sm={12}>
          <Form.Item label="Rack Type" name="rack_type">
            <Select>
              <Select.Option value={0}>A</Select.Option>
              <Select.Option value={1}>B</Select.Option>
              <Select.Option value={2}>C</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};
ItemMasterForm.propTypes = {
  formRef: PropTypes.any,
  onSubmit: PropTypes.func,
};
export default ItemMasterForm;
