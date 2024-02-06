import React from 'react';
import { Form, Input, Button, Switch, Row, Col } from 'antd';
import PropTypes from 'prop-types';

//Hooks
import { useI18n } from '../../Hooks/i18n.hook';
import { useNavigation } from '../../Hooks/Nav.hook';
const LoginForm = ({ onSubmit, loading = false }) => {
  const [, getLabel] = useI18n();
  const [, navPush] = useNavigation();
  /**
   * Send action with input values
   * @param {Object} values
   */
  const onFinish = async values => {
    if (typeof onSubmit === 'function') {
      await onSubmit(values);
    }
  };

  return (
    <Form
      name="normal_login"
      className="login-form"
      initialValues={{ remember: true }}
      onFinish={onFinish}
      layout="vertical"
    >
      <Form.Item
        name="username"
        label={getLabel('EMAIL')}
        rules={[{ required: true, message: getLabel('INPUT_USERNAME') }]}
      >
        <Input className="sub-input" />
      </Form.Item>
      <Form.Item
        name="password"
        label={getLabel('PASSWORD')}
        rules={[{ required: true, message: getLabel('INPUT_PASSWORD') }]}
      >
        <Input type="password" className="sub-input" />
      </Form.Item>
      <Form.Item>
        <Row justify="space-between">
          <Col>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <span className="login-remember">
                <Switch className="sub-check"></Switch>{' '}
                {getLabel('REMEMBER_ME')}
              </span>
            </Form.Item>
          </Col>
          <Col>
            <span
              className="login-form-forgot"
              onClick={() => navPush('/forgot')}
            >
              {getLabel('FORGOT_PASSWORD')}
            </span>
          </Col>
        </Row>
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          className="login-form-button"
          loading={loading}
        >
          {getLabel('LOGIN')}
        </Button>
      </Form.Item>
    </Form>
  );
};
LoginForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default LoginForm;
