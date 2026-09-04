import { useState, useEffect, useCallback } from 'react';

/**
 * Runs an async function and exposes { data, loading, error, reload }.
 * Centralises the loading/empty/error states every feature page needs.
 */
export function useAsync(asyncFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(() => {
    setLoading(true);
    setError(null);
    return asyncFn()
      .then((res) => setData(res))
      .catch((err) => setError(err.message || 'Failed to load'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, reload: run, setData };
}
