import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPut } from '../services/api.js';

export const SAVED_ITEMS_EVENT = 'epochNovaSavedItemsChange';

export function useSavedContent(token) {
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState('');

  const savedIds = useMemo(() => new Set(savedItems.map((item) => String(item?._id)).filter(Boolean)), [savedItems]);

  const refresh = useCallback(async () => {
    if (!token) {
      setSavedItems([]);
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiGet('/dashboard/saved-items', token);
      const items = Array.isArray(data.items) ? data.items : [];
      setSavedItems(items);
      return items;
    } catch (err) {
      setError(err.message || 'Failed to load saved content');
      setSavedItems([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token]);

  const toggleSaved = useCallback(async (contentId) => {
    if (!token) {
      throw new Error('Login required');
    }

    const data = await apiPut(`/dashboard/saved-items/${contentId}`, {}, token);
    const items = Array.isArray(data.savedItems) ? data.savedItems : [];
    setSavedItems(items);
    window.dispatchEvent(new Event(SAVED_ITEMS_EVENT));
    return data;
  }, [token]);

  useEffect(() => {
    refresh();
    const sync = () => {
      refresh();
    };

    window.addEventListener(SAVED_ITEMS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SAVED_ITEMS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [refresh]);

  return {
    savedItems,
    savedIds,
    loading,
    error,
    refresh,
    toggleSaved,
  };
}
