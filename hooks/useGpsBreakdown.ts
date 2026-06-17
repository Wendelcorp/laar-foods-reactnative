import * as React from 'react';
import { fetchGpsBreakdown, GpsBreakdownResponse } from '../api/gpsBreakdown';

export function useGpsBreakdown() {
  const [data, setData] = React.useState<GpsBreakdownResponse | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchGpsBreakdown();
      setData(res);
    } catch (e: any) {
      setError(e?.message || 'Failed to load GPS breakdown');
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
