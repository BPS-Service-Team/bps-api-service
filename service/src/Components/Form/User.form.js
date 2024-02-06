import React from 'react';
import { Col, Form, Row, Select, Input } from 'antd';
import PropTypes from 'prop-types';
//Hooks
import { useI18n } from '../../Hooks/i18n.hook';
import { useFetchRoles } from '../../Hooks/Roles.hook';

const UserForm = ({ onSubmit, formRef, edit = false }) => {
  const [, getLabel] = useI18n();
  const [data, loading] = useFetchRoles();
  return (
    <Form name="User" onFinish={onSubmit} layout="vertical" form={formRef}>
      <Row gutter={[10, 10]}>
        <Col md={12} sm={24}>
          <Form.Item
            label={getLabel('FULL_NAME')}
            name="full_name"
            rules={[{ required: true, message: getLabel('_fieldRequired') }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col md={12} sm={24}>
          <Form.Item
            label={getLabel('EMAIL')}
            name="email"
            rules={[{ required: true, message: getLabel('_fieldRequired') }]}
          >
            <Input type="email" />
          </Form.Item>
        </Col>
        <Col md={12} sm={24}>
          <Form.Item
            name="password"
            label={getLabel('PASSWORD')}
            rules={[
              {
                required: !edit,
                message: getLabel('_inputPasswordAlert'),
              },
              () => ({
                required: !edit,
                validator(rule, value) {
                  if (!rule.required && (!value || value === '')) {
                    return Promise.resolve();
                  }
                  if (!RegExp('^(?=.*[a-z])').test(value)) {
                    return Promise.reject(
                      new Error(
                        'The password must contain at least 1 lowercase alphabetical character'
                      )
                    );
                  }
                  if (!RegExp('^(?=.*[A-Z])').test(value)) {
                    return Promise.reject(
                      new Error(
                        'The password must contain at least 1 uppercase alphabetical character'
                      )
                    );
                  }
                  if (!RegExp('^(?=.*[0-9])').test(value)) {
                    return Promise.reject(
                      new Error(
                        'The password must contain at least 1 numeric character'
                      )
                    );
                  }
                  if (!RegExp('^(?=.*[!@#$%^&*])').test(value)) {
                    return Promise.reject(
                      new Error(
                        'The string must contain at least one special character'
                      )
                    );
                  }
                  if (!RegExp('^(?=.{8,})').test(value)) {
                    return Promise.reject(
                      new Error('The string must be 15 characters or longer')
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password />
          </Form.Item>
        </Col>
        <Col md={12} sm={24}>
          <Form.Item
            name="rpassword"
            label={getLabel('CONFIRM_PASSWORD')}
            dependencies={['password']}
            hasFeedback
            rules={[
              {
                required: !edit,
                message: getLabel('_confirmPasswordDialog'),
              },
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject('Passwords not match');
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Col>
        <Col md={12} sm={24}>
          <Form.Item label={getLabel('STATUS')} name="status">
            <Select>
              <Select.Option value={1}>Active</Select.Option>
              <Select.Option value={0}>Disable</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col md={12} sm={24}>
          <Form.Item
            label={getLabel('ROLE')}
            name="rol_id"
            rules={[{ required: true, message: getLabel('_fieldRequired') }]}
          >
            <Select loading={loading} placeholder="Select a role">
              {data.data.map(role => {
                if (role.group !== 'admin' && role.group !== 'staff') {
                  return;
                }
                return (
                  <Select.Option value={role._id} key={role._id}>
                    {role.group}
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};
UserForm.propTypes = {
  onSubmit: PropTypes.func,
  edit: PropTypes.bool,
  formRef: PropTypes.any,
};
export default UserForm;
