import React from 'react';

import logo from '../../Assets/img/logo.png';
import logoAlt from '../../Assets/img/bps-logo.png';
import LoginForm from '../../Components/Form/Login.form';

import { useAuth } from '../../Hooks/Auth.hook';

const LoginScreen = () => {
  const [{ loading }, login] = useAuth();
  const onSubmit = async ({ username, password }) => {
    await login(username, password);
  };
  return (
    <div className="login-screen slideInLeft">
      <div className="wrapper">
        <div className="logo">
          <img src={logo} />
          <br />
          <img src={logoAlt} />
        </div>
        <LoginForm onSubmit={onSubmit} loading={loading} />
        <div className="version">
          Site version: {process.env.REACT_APP_VERSION || '1.0.0'}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
