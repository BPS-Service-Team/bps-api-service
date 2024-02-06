import { useEffect, useState } from 'react';
import { getAgf } from '../Services/API';

export const useFetchAgfInfo = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ data: [] });

  useEffect(() => {
    setLoading(true);
    getAgf().then(response => {
      if (response.ok) {
        setData(response.data);
      } else {
        setError(response.data);
      }
      setLoading(false);
    });
  }, [setData, setError, setLoading]);

  async function update() {
    setLoading(true);
    let response = await getAgf();
    if (response.ok) {
      setData(response.data);
    } else {
      setError(response.data);
    }
    setLoading(false);
  }

  return [{ ...data }, loading, error, update];
};
