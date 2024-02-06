import React from 'react';
import { Button, Form, Input } from 'antd';
import PropTypes from 'prop-types';
//Hooks
import { useI18n } from '../../Hooks/i18n.hook';
import { useNavigation } from '../../Hooks/Nav.hook';

const ForgotForm = ({ onSubmit, formRef, loading }) => {
  const [, getLabel] = useI18n();
  const [, nav] = useNavigation();
  return (
    <Form name="Forgot" onFinish={onSubmit} layout="vertical" form={formRef}>
      <Form.Item
        label={getLabel('EMAIL')}
        name="email"
        rules={[{ required: true, message: getLabel('_fieldRequired') }]}
      >
        <Input type="email" className="sub-input" />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          className="login-form-button"
          size="large"
          loading={loading}
        >
          {getLabel('SEND_ME')}
        </Button>
      </Form.Item>
      <Form.Item>
        <Button
          type="ghost"
          className="login-form-button"
          size="large"
          onClick={() => nav('/')}
        >
          {getLabel('LOGIN_HERE')}
        </Button>
      </Form.Item>
    </Form>
  );
};
ForgotForm.propTypes = {
  onSubmit: PropTypes.func,
  formRef: PropTypes.any,
  loading: PropTypes.bool,
};
export default ForgotForm;
