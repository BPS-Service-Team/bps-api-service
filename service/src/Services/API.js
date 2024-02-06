import { create } from 'apisauce';
import { Auth } from '../Redux/reducers/auth';
import { store } from '../Redux/store';
import { getServer, getApiKey } from '../Utils/url';
import { Error } from '../Redux/reducers/error';
import { setQuery } from '../Utils/query';

export const token = () => store.getState().auth.token;
// Define the api
const API = create({
  baseURL: getServer(),
});
const monitor = response => {
  if (response.status === 401) {
    store.dispatch(Auth.authClear());
  }
  if (!response.ok) {
    if (response.status !== 401) {
      if (
        response.config.url !== '/scan-pallet' &&
        response.config.url.indexOf('/pickup-zones') === -1
      ) {
        store.dispatch(Error.errorSet(response));
      }
    }
  }
};

API.addMonitor(monitor);
export async function login(email, password) {
  return await API.post('/auth', { email, password, strategy: 'local' });
}
//Users
export const getUsers = async (queries = [], skip = 0, limit = 10) =>
  await API.get(
    `/users?$skip=${skip}&$limit=${limit}${setQuery(queries)}`,
    {},
    { headers: { Authorization: `Bearer ${token()}` } }
  );
export const createUser = async (body = {}) =>
  await API.post('/users', body, {
    headers: { Authorization: `Bearer ${token()}` },
  });
export const updateUser = async (id, body = {}) =>
  await API.patch('/users/' + id, body, {
    headers: { Authorization: `Bearer ${token()}` },
  });
//Roles
export const getRoles = async (queries = [], skip = 0, limit = 10) =>
  await API.get(
    `/roles?$skip=${skip}&$limit=${limit}${setQuery(queries)}`,
    {},
    { headers: { Authorization: `Bearer ${token()}` } }
  );
export const createRole = async (body = {}) =>
  await API.post('/roles', body, {
    headers: { Authorization: `Bearer ${token()}` },
  });
export const updateRole = async (id, body = {}) =>
  await API.patch('/roles/' + id, body, {
    headers: { Authorization: `Bearer ${token()}` },
  });
//Forgot
export async function requestForgot(email) {
  return await API.post(
    '/forgot',
    { email },
    {
      headers: { 'x-api-key': getApiKey() },
    }
  );
}

//Configs

export const getConfig = async (queries = [], skip = 0, limit = 10) =>
  await API.get(
    `/configs?$skip=${skip}&$limit=${limit}${setQuery(queries)}`,
    {},
    { headers: { Authorization: `Bearer ${token()}` } }
  );
export const createConfig = async (body = {}) =>
  await API.post('/configs', body, {
    headers: { Authorization: `Bearer ${token()}` },
  });
export const updateConfig = async (id, body = {}) =>
  await API.patch('/configs/' + id, body, {
    headers: { Authorization: `Bearer ${token()}` },
  });
export const deleteConfig = async _id =>
  await API.delete(
    `/configs/${_id}`,
    {},
    {
      headers: {
        Authorization: `bearer ${token()}`,
      },
    }
  );
//Orders

export const getOrders = async (queries = [], skip = 0, limit = 10) =>
  await API.get(
    `/orders?$skip=${skip}&$limit=${limit}${setQuery(queries)}`,
    {},
    { headers: { Authorization: `Bearer ${token()}` } }
  );
export const createOrder = async (body = {}) =>
  await API.post('/orders', body, {
    headers: { Authorization: `Bearer ${token()}` },
  });
export const updateOrder = async (id, body = {}) =>
  await API.patch('/orders/' + id, body, {
    headers: { Authorization: `Bearer ${token()}` },
  });
export const deleteOrder = async _id =>
  await API.delete(
    `/orders/${_id}`,
    {},
    {
      headers: {
        Authorization: `bearer ${token()}`,
      },
    }
  );

//Pick Zones
export const getPickZones = async (queries = [], skip = 0, limit = 10) =>
  await API.get(
    `/pickup-zones?$skip=${skip}&$limit=${limit}${setQuery(queries)}`,
    {},
    { headers: { Authorization: `Bearer ${token()}` } }
  );
export const updatePickupZone = async (id, body = {}) =>
  await API.patch('/pickup-zones/' + id, body, {
    headers: { Authorization: `Bearer ${token()}` },
  });

//Scan Pallet scan-pallet
export const scanPallet = async (body = {}) =>
  await API.post('/scan-pallet', body, {
    headers: { Authorization: `Bearer ${token()}` },
  });

//WMS Logs
export const getWmsLogs = async (queries = [], skip = 0, limit = 10) =>
  await API.get(
    `/wms-logs?$sort[created_at]=-1&$skip=${skip}&$limit=${limit}${setQuery(
      queries
    )}`,
    {},
    { headers: { Authorization: `Bearer ${token()}` } }
  );

//Items
export const getItems = async (queries = [], skip = 0, limit = 10) =>
  await API.get(
    `/items?$skip=${skip}&$limit=${limit}${setQuery(queries)}`,
    {},
    { headers: { Authorization: `Bearer ${token()}` } }
  );
export const createItem = async (body = {}) =>
  await API.post('/items', body, {
    headers: { Authorization: `Bearer ${token()}` },
  });
export const updateItem = async (id, body = {}) =>
  await API.patch('/items/' + id, body, {
    headers: { Authorization: `Bearer ${token()}` },
  });
export const deleteItem = async _id =>
  await API.delete(
    `/items/${_id}`,
    {},
    {
      headers: {
        Authorization: `bearer ${token()}`,
      },
    }
  );
//Stocks
export const getStocks = async (queries = [], skip = 0, limit = 10) =>
  await API.get(
    `/stocks?$skip=${skip}&$limit=${limit}${setQuery(queries)}`,
    {},
    { headers: { Authorization: `Bearer ${token()}` } }
  );
export const createStock = async (body = {}) =>
  await API.post('/stocks', body, {
    headers: { Authorization: `Bearer ${token()}` },
  });
export const updateStock = async (id, body = {}) =>
  await API.patch('/stocks/' + id, body, {
    headers: { Authorization: `Bearer ${token()}` },
  });
export const deleteStock = async _id =>
  await API.delete(
    `/stocks/${_id}`,
    {},
    {
      headers: {
        Authorization: `bearer ${token()}`,
      },
    }
  );
//Stocks Report
export const getStockR = async (queries = [], skip = 0, limit = 10) =>
  await API.get(
    `/stock-report?skip=${skip}&limit=${limit}${setQuery(queries)}`,
    {},
    { headers: { Authorization: `Bearer ${token()}` } }
  );
export const updateStockR = async (id, body = {}) =>
  await API.patch('/stock-report/' + id, body, {
    headers: { Authorization: `Bearer ${token()}` },
  });
export const createStockR = async (body = {}) =>
  await API.post('/stock-report/', body, {
    headers: { Authorization: `Bearer ${token()}` },
  });
//Pallet ready
export const palletReady = async (body = {}) =>
  await API.post('/pallet-ready', body, {
    headers: { Authorization: `Bearer ${token()}` },
  });
//Putaway Force Finish
export const forceFinish = async id =>
  await API.post(
    '/orders/putaway/force-finish',
    { order_id: id },
    { headers: { Authorization: `Bearer ${token()}` } }
  );
//AGF tasks
export const createAgfTask = async (body = {}) =>
  await API.post('/agf-tasks', body, {
    headers: {
      Authorization: `Bearer ${token()}`,
      'skip-encapsulation': '1',
      'cycle-count-log': '1',
    },
  });
export const getAgfTasks = async (queries = [], skip = 0, limit = 10) =>
  await API.get(
    `/agf-tasks?$skip=${skip}&$limit=${limit}${setQuery(queries)}`,
    {},
    { headers: { Authorization: `Bearer ${token()}` } }
  );
export const updateAgfTasks = async (id, body = {}) =>
  await API.patch('/agf-tasks/' + id, body, {
    headers: { Authorization: `Bearer ${token()}` },
  });
//AGF single
export const getAgfSingle = async (queries = [], skip = 0, limit = 10) =>
  await API.get(
    `/agfs?$skip=${skip}&$limit=${limit}${setQuery(queries)}`,
    {},
    { headers: { Authorization: `Bearer ${token()}` } }
  );
export const updateAgfSingle = async (id, body = {}) =>
  await API.patch('/agfs/' + id, body, {
    headers: { Authorization: `Bearer ${token()}` },
  });
//Others
export const cancelAgfTask = async (task_no, operation = undefined) =>
  await API.post(
    '/agfs/wes/cancel',
    { task_no, operation },
    {
      headers: { Authorization: `Bearer ${token()}` },
    }
  );
export const forceAgfTask = async task_no =>
  await API.post(
    '/agfs/force',
    { task_no },
    {
      headers: { Authorization: `Bearer ${token()}` },
    }
  );
export const startAgfTask = async sTaskNo =>
  await API.post(
    '/agfs/start',
    {
      taskNo: sTaskNo,
      deviceName: 'Any',
      taskState: 2,
      lpn: 'Any',
    },
    {
      headers: { Authorization: `Bearer ${token()}` },
    }
  );
export const checkAgfTask = async sTaskNo =>
  await API.post(
    '/agfs/check',
    {
      taskNo: sTaskNo,
      deviceName: 'Any',
      taskState: 3,
      lpn: 'Any',
      palletType: '1000',
      checkWidthResult: 1,
      checkHeightResult: 1,
    },
    {
      headers: { Authorization: `Bearer ${token()}` },
    }
  );
export const finishAgfTask = async sTaskNo =>
  await API.post(
    '/agfs/finish',
    {
      taskNo: sTaskNo,
      deviceName: 'Any',
      taskState: 4,
      lpn: 'Any',
    },
    {
      headers: { Authorization: `Bearer ${token()}` },
    }
  );
export const removeAgfTask = async task =>
  await API.post(
    '/agfs/delete',
    { task },
    {
      headers: { Authorization: `Bearer ${token()}` },
    }
  );
export const calculatePicking = async order_id =>
  await API.post(
    '/orders/picking/calculate',
    { order_id },
    {
      headers: { Authorization: `Bearer ${token()}` },
    }
  );
export const calculateProcessPicking = async (
  operation,
  pallets,
  order_id,
  calculate
) =>
  await API.post(
    '/orders/picking/process-calculate',
    {
      operation,
      pallets,
      order_id,
      calculate,
    },
    {
      headers: { Authorization: `Bearer ${token()}` },
    }
  );
export const pickingReady = async body =>
  await API.post('/orders/picking/ready', body, {
    headers: { Authorization: `Bearer ${token()}` },
  });
export const releasePicking = async body =>
  await API.post('/orders/picking/release', body, {
    headers: { Authorization: `Bearer ${token()}` },
  });
export const getInventoryOperation = async () =>
  await API.get(
    '/api/stocks/wms',
    {},
    {
      headers: { Authorization: `Bearer ${token()}` },
    }
  );
//AGF
export const getAgf = async () =>
  await API.get(
    `/agfs`,
    {},
    { headers: { Authorization: `Bearer ${token()}` } }
  );

//Transactions
export const getTransactions = async (queries = [], skip = 0, limit = 10) =>
  await API.get(
    `/transaction-report?skip=${skip}&limit=${limit}${setQuery(queries)}`,
    {},
    { headers: { Authorization: `Bearer ${token()}` } }
  );

// Collection export
export const consultCollections = async sCollection =>
  await API.get(
    `/export-collections/${sCollection}`,
    {},
    {
      headers: { Authorization: `Bearer ${token()}` },
    }
  );

export const getCollections = async (sCollection, sExtras = '') =>
  fetch(
    `${getServer()}/export-collections/${sCollection}${
      sExtras !== '' ? '?' + sExtras : ''
    }`,
    {
      headers: {
        Authorization: `Bearer ${token()}`,
      },
    }
  );

export const resendCall = async (command, order_id) =>
  await API.post(
    `/resend-calls`,
    {
      command,
      order_id,
    },
    {
      headers: { Authorization: `Bearer ${token()}` },
    }
  );

export const customResendCall = async payload =>
  await API.post('/resend-calls', payload, {
    headers: { Authorization: `Bearer ${token()}` },
  });

export const sendReconciliation = async (oBody, oSettings, contentJson) =>
  await API.post('/agvs/reconciliation', oBody, {
    ...oSettings,
    headers: {
      Authorization: `Bearer ${token()}`,
      'content-type': contentJson ? 'application/json' : 'multipart/form-data',
    },
  });
export const getChartsData = async () =>
  await API.post(
    '/utils',
    { action: 'charts-information' },
    {
      headers: { Authorization: `Bearer ${token()}` },
    }
  );

//Services
export const getServices = async () =>
  await API.get(
    `/services`,
    {},
    {
      headers: { Authorization: `Bearer ${token()}` },
    }
  );
export const backupDatabase = async () =>
  fetch(`${getServer()}/db-backup`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token()}`,
    },
  });

//Recalculation
export const finishRecalculation = async (body = {}) =>
  await API.post('/recalculation', body, {
    headers: {
      Authorization: `Bearer ${token()}`,
    },
  });
