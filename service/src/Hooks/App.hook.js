import { useSelector, useDispatch } from 'react-redux';
import { App } from '../Redux/reducers/app';

export function useDrawer() {
  const drawer = useSelector(({ app }) => app.drawer);
  const dispatch = useDispatch();
  function change(value) {
    dispatch(App.appDrawer(value));
  }
  return [drawer, change];
}
