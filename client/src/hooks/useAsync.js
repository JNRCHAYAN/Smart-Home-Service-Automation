import { useCallback, useEffect, useState } from 'react';
import { apiError } from '../api/index.js';
import { toast } from '../store/toastStore.js';

export function useAsync(fn, deps = [], { onSuccess, silent } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn(...args);
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      setError(err);
      if (!silent) toast.error(apiError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, run, setData };
}
