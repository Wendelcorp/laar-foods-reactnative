import { API_BASE, buildAuthHeaders } from '../config/api';

export type NightDeliveryStoreEntry = {
  store_number: string;
  night_sales: number;
};

export type NightDeliveryDay = {
  date: string;
  stores: NightDeliveryStoreEntry[];
};

export type NightDeliveriesHistoryResponse = {
  start_date: string;
  end_date: string;
  stores: NightDeliveryDay[];
};

export async function fetchNightDeliveriesHistory(): Promise<NightDeliveriesHistoryResponse> {
  const headers = await buildAuthHeaders();
  const res = await fetch(`${API_BASE}/api/night_deliveries`, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch night deliveries: HTTP ${res.status}${text ? `: ${text}` : ''}`);
  }
  return res.json();
}
