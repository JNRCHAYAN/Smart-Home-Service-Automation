import { useCallback, useEffect, useState } from 'react';
import { apiError } from '../api/index.js';
import { toast } from '../store/toastStore.js';

// Data-fetching hook: runs `fn` on mount and exposes { data, loading, error,
// run, setData }. `run` re-executes (used to refetch after mutations) and
// rethrows so callers can add their own handling. Errors auto-surface as a
// toast unless `silent` is set (used by background polls).
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
