import React, { useState } from 'react';
import { message, Button } from 'antd';
import logo from '../../Assets/img/logo.png';
import ForgotForm from '../../Components/Form/Forgot.form';
import { requestForgot } from '../../Services/API';

import { useI18n } from '../../Hooks/i18n.hook';
import { useNavigation } from '../../Hooks/Nav.hook';

const ForgotScreen = () => {
  const [, l] = useI18n();
  const [success, setSuccess] = useState(0);
  const [loading, setLoading] = useState(false);
  const [, nav] = useNavigation();
  const _handleSubmit = async values => {
    setLoading(true);
    let response = await requestForgot(values);
    if (response.ok) {
      setSuccess(1);
    } else {
      message.error(l(response.data.message));
    }
    setLoading(false);
  };
  const _renderContent = () => {
    if (success === 1) {
      return (
        <div>
          We send email to change password
          <Button
            type="ghost"
            className="login-form-button"
            size="large"
            onClick={() => nav('/')}
          >
            {l('LOGIN_HERE')}
          </Button>
        </div>
      );
    }
    return (
      <>
        <div>
          <h3>{l('FORGOT_PASSWORD')}</h3>
          <p>{l('FORGOT_CONTENT')}</p>
        </div>
        <ForgotForm onSubmit={_handleSubmit} loading={loading} />
      </>
    );
  };
  return (
    <div className="forgot-screen slideInDown">
      <div className="wrapper">
        <div className="logo">
          <img src={logo} />
        </div>

        {_renderContent()}
      </div>
      <div className="cover"></div>
    </div>
  );
};

export default ForgotScreen;
