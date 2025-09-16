import * as React from 'react';
import { fetchZenputLogs, ZenputResponse } from '../api/zenput';

export function useZenputLogs() {
  const [data, setData] = React.useState<ZenputResponse | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchZenputLogs();
      setData(res);
    } catch (e: any) {
      setError(e?.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    error,
    refresh: load,
  } as const;
}


