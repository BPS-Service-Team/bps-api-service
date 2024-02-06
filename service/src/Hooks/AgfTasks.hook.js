import { useEffect, useState } from 'react';
import { getAgfTasks } from '../Services/API';

export const useFetchAgfTasks = (queries = [], skip = 0, limit = 10) => {
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState({ queries, skip, limit });
  const [error, setError] = useState(null);
  const [data, setData] = useState({ data: [] });
  useEffect(() => {
    setLoading(true);
    getAgfTasks(params.queries, params.skip, params.limit).then(response => {
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
    let response = await getAgfTasks(params.queries, params.skip, params.limit);
    if (response.ok) {
      setData(response.data);
    } else {
      setError(response.data);
    }
    setLoading(false);
  }
  return [{ ...data, params }, loading, error, onChangeParams, update];
};
