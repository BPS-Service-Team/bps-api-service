import { useSelector, useDispatch } from 'react-redux';
import { App } from '../Redux/reducers/app';

export function useWorkstationId() {
  const workstation = useSelector(({ app }) => app.workstation);
  const dispatch = useDispatch();
  function change(value) {
    dispatch(App.appWorkstation(workstation.merge({ workstationId: value })));
  }
  return [workstation.workstationId, change];
}
export function usePickupZones() {
  const workstation = useSelector(({ app }) => app.workstation);
  const dispatch = useDispatch();
  function change(value) {
    dispatch(App.appWorkstation(workstation.merge({ pickZones: value })));
  }
  return [workstation.pickZones, change];
}
export function usePallets() {
  const workstation = useSelector(({ app }) => app.workstation);
  const dispatch = useDispatch();
  function change(value) {
    dispatch(App.appWorkstation(workstation.merge({ pallets: value })));
  }
  return [workstation.pallets, change];
}
export function useWorkstation() {
  const workstation = useSelector(({ app }) => app.workstation);
  const dispatch = useDispatch();
  function change(value) {
    dispatch(App.appWorkstation(value));
  }
  return [workstation, change];
}
export function useClearWorkstation() {
  const dispatch = useDispatch();
  function change() {
    dispatch(App.appClear());
  }
  return change;
}
