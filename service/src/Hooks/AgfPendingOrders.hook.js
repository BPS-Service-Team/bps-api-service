import { useEffect, useState } from 'react';
import { getOrders } from '../Services/API';

export const useFetchAgfOrders = (queries = [], skip = 0, limit = 10) => {
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState({ queries, skip, limit });
  const [error, setError] = useState(null);
  const [data, setData] = useState({ data: [] });
  let pendingAgfQuery = [
    { field: 'status', value: 2 },
    { field: 'agf_status', value: 0 },
  ];
  useEffect(() => {
    setLoading(true);
    getOrders(
      pendingAgfQuery.concat(params.queries),
      params.skip,
      params.limit
    ).then(response => {
      if (response.ok) {
        setData(response.data);
      } else {
        setError(response.data);
      }
      setLoading(false);
    });
  }, [params, setData, setError, setLoading]);
  function onChangeParams(q = [], s = 0, l = 10) {
    setParams({ queries: q, skip: s, limit: l });
  }
  async function update() {
    setLoading(true);
    let response = await getOrders(params.queries, params.skip, params.limit);
    if (response.ok) {
      setData(response.data);
    } else {
      setError(response.data);
    }
    setLoading(false);
  }
  return [{ ...data, params }, loading, error, onChangeParams, update];
};
