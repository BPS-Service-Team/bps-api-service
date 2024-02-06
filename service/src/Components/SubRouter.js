import React from 'react';
import propTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';
import { withRouter } from 'react-router-dom';

import HomeScreen from '../Screens/Home';
import AgfWorkstation from '../Screens/AgfWorkstation';
import UserScreen from '../Screens/Users';
import ConfigScreen from '../Screens/Configurations';
import ItemsScreen from '../Screens/Items';
import StocksScreen from '../Screens/Stocks';
import OrdersScreen from '../Screens/Orders';
import AgfQueue from '../Screens/AgfQueue';
import CallLogsScreen from '../Screens/CallLogs';
import TransactionsScreen from '../Screens/Transactions';
import RecalculationScreen from '../Screens/Recalculation';

const SubRouter = ({ match: { url }, locations }) => {
  return (
    <Switch>
      <Route
        path={`${url}`}
        component={HomeScreen}
        location={locations}
        exact
      />
      <Route
        path={`${url}/agf-workstation`}
        component={AgfWorkstation}
        location={locations}
      />
      <Route
        path={`${url}/users`}
        component={UserScreen}
        location={locations}
      />
      <Route
        path={`${url}/configurations`}
        component={ConfigScreen}
        location={locations}
      />
      <Route
        path={`${url}/items`}
        component={ItemsScreen}
        location={locations}
      />
      <Route
        path={`${url}/agf-queue`}
        component={AgfQueue}
        location={locations}
      />
      <Route
        location={locations}
        path={`${url}/stocks`}
        component={StocksScreen}
      />
      <Route
        location={locations}
        path={`${url}/orders`}
        component={OrdersScreen}
      />
      <Route
        location={locations}
        path={`${url}/transactions`}
        component={TransactionsScreen}
      />
      <Route
        component={CallLogsScreen}
        location={locations}
        path={`${url}/call-logs`}
      />
      <Route
        component={RecalculationScreen}
        location={locations}
        path={`${url}/recalculation`}
      />
    </Switch>
  );
};
SubRouter.propTypes = {
  match: propTypes.shape({
    url: propTypes.string.isRequired,
  }),
  locations: propTypes.object,
};
export default withRouter(SubRouter);
