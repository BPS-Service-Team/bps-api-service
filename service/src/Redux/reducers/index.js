import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';

import auth from './auth';
import i18n from './i18n';
import error from './error';
import app from './app';

const reducer = history =>
  combineReducers({
    router: connectRouter(history),
    auth,
    i18n,
    error,
    app,
  });

export default reducer;
