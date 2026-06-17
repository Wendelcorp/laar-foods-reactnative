import { API_BASE, buildAuthHeaders, getApiKey } from '../config/api';

export interface GpsMetricRow {
  metric: string;
  last_7_days: number | null;
  last_28_days: number | null;
  ytd: number | null;
  last_7_days_color?: string | null;
  last_28_days_color?: string | null;
  ytd_color?: string | null;
}

export interface GpsStore {
  store_id: string;
  store_number: string;
  metrics: GpsMetricRow[];
}

export interface GpsBreakdownResponse {
  end_date: string;
  ranges: {
    last_7_days: { start: string; end: string };
    last_28_days: { start: string; end: string };
    ytd: { start: string; end: string };
  };
  stores: GpsStore[];
}

export function gpsStoreNumber(storeNumber: string): number {
  const parsed = parseInt(storeNumber, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function fetchGpsBreakdown(): Promise<GpsBreakdownResponse> {
  const headers = await buildAuthHeaders();
  const apiKey = await getApiKey();
  const url = `${API_BASE}/api/gps_breakdown?api_key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch GPS breakdown: HTTP ${res.status}${text ? `: ${text}` : ''}`);
  }
  return res.json();
}

export async function triggerGpsBreakdownScrape() {
  const apiKey = await getApiKey();
  const url = `${API_BASE}/api/scrape_gps_breakdown?api_key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Failed to trigger GPS scrape: HTTP ${res.status}`);
  }
  return res.json();
}
