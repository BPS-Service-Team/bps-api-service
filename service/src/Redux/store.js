import { persistStore, persistReducer } from 'redux-persist';
import {
  seamlessImmutableReconciler,
  seamlessImmutableTransformCreator,
} from 'redux-persist-seamless-immutable';

import { applyMiddleware, compose, createStore } from 'redux';
import { createBrowserHistory } from 'history';
import { routerMiddleware } from 'connected-react-router';
import storage from 'redux-persist/lib/storage';
import Logger from 'redux-logger';
import thunk from 'redux-thunk';
import reducers from './reducers';

export const history = createBrowserHistory({
  initialEntries: [{ state: { key: 'home' } }],
});
const transformerConfig = {
  whitelistPerReducer: {
    auth: ['token', 'user', 'role'],
    app: ['workstation'],
  },
};

const persistConfig = {
  key: 'bps-v1.0',
  storage, // Defaults to localStorage
  stateReconciler: seamlessImmutableReconciler,
  transforms: [seamlessImmutableTransformCreator(transformerConfig)],
  whitelist: ['auth', 'app'],
};

const persistedReducer = persistReducer(persistConfig, reducers(history));

export const store = createStore(
  persistedReducer,
  compose(applyMiddleware(routerMiddleware(history), Logger, thunk))
);

export const persistor = persistStore(store);
