import immutable from 'seamless-immutable';
import { createReducer, createActions } from 'reduxsauce';

const { Types, Creators } = createActions({
  errorSet: ['error'],
  errorClear: [],
});
const INITIAL_STATE = immutable({
  error: false,
  errorMessage: null,
  data: {},
  originalError: null,
});

function set(state, action) {
  return state.merge({
    error: true,
    ...action.error,
  });
}
function clear() {
  return INITIAL_STATE;
}

const HANDLERS = {
  [Types.ERROR_SET]: set,
  [Types.ERROR_CLEAR]: clear,
};

export const Error = Creators;
export const appTypes = Types;
export default createReducer(INITIAL_STATE, HANDLERS);
