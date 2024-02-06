import { useEffect, useState } from 'react';
import { getStockR, getStocks } from '../Services/API';
import { normalizeQueries } from '../Utils/query';
export const useFetchStocks = (queries = [], skip = 0, limit = 10) => {
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState({
    queries: normalizeQueries(queries),
    skip,
    limit,
  });
  const [error, setError] = useState(null);
  const [data, setData] = useState({ data: [] });
  useEffect(() => {
    setLoading(true);
    getStockR(params.queries, params.skip, params.limit).then(response => {
      if (response.ok) {
        setData(response.data);
      } else {
        setError(response.data);
      }
      setLoading(false);
    });
  }, [params, setData, setError, setLoading]);
  function onChangeParams(q = [], s = 0, l = 10) {
    setParams({ queries: normalizeQueries(q), skip: s, limit: l });
  }
  async function update() {
    setLoading(true);
    let response = await getStockR(params.queries, params.skip, params.limit);
    if (response.ok) {
      setData(response.data);
    } else {
      setError(response.data);
    }
    setLoading(false);
  }
  return [{ ...data, params }, loading, error, onChangeParams, update];
};
export const useFetchRawStocks = (queries = [], skip = 0, limit = 10) => {
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState({
    queries: normalizeQueries(queries),
    skip,
    limit,
  });
  const [error, setError] = useState(null);
  const [data, setData] = useState({ data: [] });
  useEffect(() => {
    setLoading(true);
    getStocks(params.queries, params.skip, params.limit).then(response => {
      if (response.ok) {
        setData(response.data);
      } else {
        setError(response.data);
      }
      setLoading(false);
    });
  }, [params, setData, setError, setLoading]);
  function onChangeParams(q = [], s = 0, l = 10) {
    setParams({ queries: normalizeQueries(q), skip: s, limit: l });
  }
  async function update() {
    setLoading(true);
    let response = await getStockR(params.queries, params.skip, params.limit);
    if (response.ok) {
      setData(response.data);
    } else {
      setError(response.data);
    }
    setLoading(false);
  }
  return [{ ...data, params }, loading, error, onChangeParams, update];
};
