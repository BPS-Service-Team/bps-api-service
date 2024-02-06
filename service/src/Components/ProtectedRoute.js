import React from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect } from 'react-router-dom';

const ProtectedRoute = ({ component: Component, token, redirect, ...rest }) => {
  return (
    <Route
      {...rest}
      render={props => {
        if (token !== '') {
          return <Component {...props} />;
        } else {
          return <Redirect to={redirect} />;
        }
      }}
    />
  );
};
ProtectedRoute.propTypes = {
  component: PropTypes.any,
  token: PropTypes.string,
  redirect: PropTypes.any,
};
export default ProtectedRoute;
