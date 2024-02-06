import React from 'react';
import { Form, Input, Select } from 'antd';
import PropTypes from 'prop-types';

const AgfSingleForm = ({ onSubmit, formRef }) => {
  return (
    <Form name="Agf" onFinish={onSubmit} layout="vertical" form={formRef}>
      <Form.Item
        label="Name"
        name="device_name"
        rules={[{ required: true, message: 'This field is required!' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="status" label="Status">
        <Select style={{ width: '100%' }}>
          <Select.Option value={0}>Idle</Select.Option>
          <Select.Option value={1}>Busy</Select.Option>
          <Select.Option value={2}>Paused</Select.Option>
          <Select.Option value={3}>Charging</Select.Option>
          <Select.Option value={4}>Locked</Select.Option>
          <Select.Option value={5}>Error</Select.Option>
        </Select>
      </Form.Item>
    </Form>
  );
};
AgfSingleForm.propTypes = {
  onSubmit: PropTypes.func,
  formRef: PropTypes.any,
  loading: PropTypes.bool,
};
export default AgfSingleForm;
