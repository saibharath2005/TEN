import { useEffect, useState } from 'react';
import { apiGet } from '../services/api.js';

export function useApiCollection(name) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    apiGet(`/${name}`)
      .then((data) => mounted && setItems(data.items || []))
      .catch(() => mounted && setItems([]))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [name]);

  return { items, loading, setItems };
}
