import { useSelector, useDispatch } from 'react-redux';
import { message } from 'antd';

import { persistor } from '../Redux/store';

import { Auth } from '../Redux/reducers/auth';

import { login } from '../Services/API';
import { useI18n } from './i18n.hook';

export function useAuth() {
  const { auth } = useSelector(state => ({ auth: state.auth }));
  const [, getLabel] = useI18n();
  const dispatch = useDispatch();
  async function post(username, password) {
    dispatch(Auth.authRequest());
    let response = await login(username, password);
    if (response.ok) {
      let {
        accessToken,
        user: { rol_name, rol, rol_id, ...user },
      } = response.data;
      if (rol === 'admin' || rol === 'staff') {
        dispatch(
          Auth.authSuccess(accessToken, user, {
            rol,
            rol_id,
            rol_name,
          })
        );
      } else {
        dispatch(Auth.authFailure());
        message.error(getLabel('USER_NOT_ALLOWED'));
      }
    } else {
      dispatch(Auth.authFailure());
      message.error(getLabel('ERROR_LOGIN'));
    }
  }
  function logout() {
    dispatch(Auth.authClear());
    persistor.flush();
    persistor.purge();
  }
  return [auth, post, logout];
}
