import { API_BASE, buildAuthHeaders, getApiKey } from '../config/api';

export type ZenputLabels = Record<string, number | null>;

export interface ZenputStore {
  store_name: string;
  store_id: number;
  labels: ZenputLabels;
}

export interface ZenputResponse {
  date_start: string;
  date_end: string;
  stores: ZenputStore[];
}

/** Zenput encodes store numbers in store_name, e.g. "100006" → 6, "100941" → 941 */
export function zenputStoreNumber(storeName: string): number {
  const parsed = parseInt(storeName.replace(/^1/, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function fetchZenputLogs(): Promise<ZenputResponse> {
  const headers = await buildAuthHeaders();
  const apiKey = await getApiKey();
  const url = `${API_BASE}/api/zenput_logs?api_key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch logs: HTTP ${res.status}${text ? `: ${text}` : ''}`);
  }
  return res.json();
}

export async function triggerZenputScrape(dateStart: string, dateEnd: string) {
  const apiKey = await getApiKey();
  const url = `${API_BASE}/api/scrape_zenput_logs?date_start=${encodeURIComponent(dateStart)}&date_end=${encodeURIComponent(dateEnd)}&api_key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Failed to trigger scrape: HTTP ${res.status}`);
  }
  return res.json();
}


