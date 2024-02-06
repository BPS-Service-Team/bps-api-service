import React from 'react';
import { Col, Form, Row, Select, Input } from 'antd';
import PropTypes from 'prop-types';
import PermissionEditor from '../Roles/PermissionEditor';
//Hooks
import { useI18n } from '../../Hooks/i18n.hook';

const RoleForm = ({ onSubmit, formRef, permissions }) => {
  const [, getLabel] = useI18n();
  const _handleChangePermissions = values => {
    formRef.setFieldsValue({
      permissions: values,
    });
  };
  return (
    <Form name="User" onFinish={onSubmit} layout="vertical" form={formRef}>
      <Form.Item
        name="permissions"
        rules={[{ required: true, message: getLabel('_fieldRequired') }]}
        noStyle
      >
        <Input style={{ display: 'none' }} />
      </Form.Item>
      <Row justify="space-between" gutter={[20, 20]}>
        <Col md={12} sm={24}>
          <Row gutter={[10, 10]}>
            <Col md={24} sm={24}>
              <Form.Item
                label={getLabel('NAME')}
                name="name"
                rules={[
                  { required: true, message: getLabel('_fieldRequired') },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col md={24} sm={24}>
              <Form.Item
                name="group"
                label={getLabel('GROUP')}
                rules={[
                  { required: true, message: getLabel('_fieldRequired') },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col md={24} sm={24}>
              <Form.Item
                label={getLabel('STATUS')}
                name="status"
                rules={[
                  { required: true, message: getLabel('_fieldRequired') },
                ]}
              >
                <Select>
                  <Select.Option value={1}>Active</Select.Option>
                  <Select.Option value={0}>Disable</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Col>
        <Col md={12} sm={24}>
          <PermissionEditor
            rolePermissions={permissions}
            handler={_handleChangePermissions}
          />
        </Col>
      </Row>
    </Form>
  );
};
RoleForm.propTypes = {
  onSubmit: PropTypes.func,
  edit: PropTypes.bool,
  formRef: PropTypes.any,
  permissions: PropTypes.array,
};
export default RoleForm;
