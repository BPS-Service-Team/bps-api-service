import { useEffect, useState } from 'react';
import { getItems } from '../Services/API';

export const useFetchItems = (queries = [], skip = 0, limit = 10) => {
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState({ queries, skip, limit });
  const [error, setError] = useState(null);
  const [data, setData] = useState({ data: [] });
  useEffect(() => {
    setLoading(true);
    getItems(params.queries, params.skip, params.limit).then(response => {
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
    let response = await getItems(params.queries, params.skip, params.limit);
    if (response.ok) {
      setData(response.data);
    } else {
      setError(response.data);
    }
    setLoading(false);
  }
  return [{ ...data, params }, loading, error, onChangeParams, update];
};
