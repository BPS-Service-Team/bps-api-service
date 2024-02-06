import React from 'react';
import { Switch } from 'react-router-dom';
import { push } from 'connected-react-router';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import Login from '../Screens/Login';
import Dashboard from '../Screens/Dashboard';

import ProtectedRoute from './ProtectedRoute';
import ForgotScreen from '../Screens/Forgot';

const Router = ({ token }) => {
  return (
    <Switch>
      <ProtectedRoute
        exact
        path="/"
        component={Login}
        token={token === '' ? '1' : ''}
        redirect={{
          pathname: '/dashboard',
          state: {
            key: 'dashboard',
          },
        }}
      />
      <ProtectedRoute
        path="/dashboard"
        component={Dashboard}
        token={token}
        redirect={{
          pathname: '/',
          state: {
            key: 'login',
          },
        }}
      />
      <ProtectedRoute
        path="/forgot"
        component={ForgotScreen}
        token={token === '' ? '1' : ''}
        redirect={{
          pathname: '/dashboard',
          state: {
            key: 'dashboard',
          },
        }}
      />
    </Switch>
  );
};

const mapStateStore = state => {
  return {
    token: state.auth.token,
    location: state.router.location,
  };
};

const mapStateFunc = { navigatePush: push };

Router.propTypes = {
  token: PropTypes.string.isRequired,
  location: PropTypes.object.isRequired,
};

export default connect(mapStateStore, mapStateFunc)(Router);
