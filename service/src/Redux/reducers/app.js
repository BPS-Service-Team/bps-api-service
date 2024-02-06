import immutable from 'seamless-immutable';
import { createReducer, createActions } from 'reduxsauce';

const { Types, Creators } = createActions({
  appDrawer: ['drawer'],
  appWorkstation: ['workstation'],
  appClear: [],
  appCartClean: [],
});
export const INITIAL_WORKSTATION_STATE = {
  workstationId: '1',
  pickup_id: null,
  pickup: null,
  pickZones: [
    // STATUS 0 - not available, 1 - available , 2 - Currently Busy
    { label: 'WS1', status: 0, id: null, workstation: '1' },
    { label: 'WS2', status: 0, id: null, workstation: '1' },
    { label: 'WS3', status: 0, id: null, workstation: '2' },
    { label: 'WS4', status: 0, id: null, workstation: '2' },
  ],
  items: [],
  pallet: null,
  orderDetail: null,
  currentPickupZone: null,
  currentStocks: {},
  pending: null,
  taskFinish: false,
  taskResult: null,
  picking: null,
  palletModalView: false,
  itemModalView: false,
};
const INITIAL_STATE = immutable({
  drawer: false,
  error: false,
  errorMessage: null,
  workstation: INITIAL_WORKSTATION_STATE,
});

function appWorkstation(state, action) {
  const { workstation } = action;
  return state.updateIn(['workstation'], row => row.merge(workstation));
}
function drawer(state, action) {
  return state.merge({
    drawer: action.drawer,
  });
}
function clear() {
  return INITIAL_STATE;
}
const HANDLERS = {
  [Types.APP_CLEAR]: clear,
  [Types.APP_DRAWER]: drawer,
  [Types.APP_WORKSTATION]: appWorkstation,
};

export const App = Creators;
export const appTypes = Types;
export default createReducer(INITIAL_STATE, HANDLERS);
