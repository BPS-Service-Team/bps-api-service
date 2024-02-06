import immutable from 'seamless-immutable';
import { createReducer, createActions } from 'reduxsauce';

const { Types, Creators } = createActions({
  authRequest: [],
  authSuccess: ['token', 'user', 'role'],
  authFailure: ['error'],
  authClear: [],
});
const INITIAL_STATE = immutable({
  token: '',
  user: {},
  role: {},
  error: false,
  errorMessage: null,
});

function success(state, action) {
  let { user, token, role } = action;
  return state.merge({
    loading: false,
    error: false,
    errorMessage: null,
    user,
    token,
    role,
  });
}
function request(state) {
  return state.merge({ loading: true, error: false, errorMessage: null });
}
function failure(state, action) {
  let { error } = action;
  return state.merge({
    loading: false,
    error: true,
    errorMessage: error,
  });
}
function clear() {
  return INITIAL_STATE;
}

const HANDLERS = {
  [Types.AUTH_REQUEST]: request,
  [Types.AUTH_SUCCESS]: success,
  [Types.AUTH_FAILURE]: failure,
  [Types.AUTH_CLEAR]: clear,
};

export const Auth = Creators;
export const authTypes = Types;
export default createReducer(INITIAL_STATE, HANDLERS);
