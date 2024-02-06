import { useSelector, useDispatch } from 'react-redux';
import { Error } from '../Redux/reducers/error';
export function useError() {
  const error = useSelector(state => state.error);
  const dispatch = useDispatch();
  function setError(e) {
    dispatch(Error.errorSet(e));
  }
  function clear() {
    dispatch(Error.errorClear());
  }
  return [error, setError, clear];
}
