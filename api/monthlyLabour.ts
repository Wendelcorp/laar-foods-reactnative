import { API_BASE, buildAuthHeaders } from '../config/api';

export type LabourStore = {
  store_number: number;
  net_sales: number;
  hours: number;
  average: number;
  target_difference: number;
  under_target: boolean;
  days_with_data: number;
};

export type LabourData = {
  month_display: string;
  consolidated: {
    net_sales: string;
    hours: string;
    average: string;
    target_difference: string;
    under_target: boolean;
  };
  stores: Record<string, LabourStore>;
  store_summary: {
    total_stores: number;
    stores_under_target: number;
    stores_over_target: number;
    best_store: { store_number: number; average: number };
    worst_store: { store_number: number; average: number };
  };
  updated_at?: string;
};

export async function fetchLatestMonthlyLabour(): Promise<LabourData> {
  const headers = await buildAuthHeaders();
  const res = await fetch(`${API_BASE}/api/monthly_labours/latest`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Failed to fetch labour data: HTTP ${res.status}`);
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error('Failed to fetch labour data');
  }
  return json.data;
}
