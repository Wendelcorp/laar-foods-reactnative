import { API_BASE, buildAuthHeaders } from '../config/api';

export interface ShiftEmployee {
  name: string;
  shift_time: string; // e.g. "5AM - 1PM"
  overnight: boolean;
  start_time_minutes: number; // minutes since midnight
}

export interface ShiftStore {
  store_number: string; // "6", "941", etc
  employee_count: number;
  employees: ShiftEmployee[];
}

export interface TodayShiftsResponse {
  date: string; // Pretty, e.g. "Friday, August 29, 2025"
  total_employees: number;
  stores: ShiftStore[];
}

export async function fetchTodayShifts(): Promise<TodayShiftsResponse> {
  const headers = await buildAuthHeaders();
  const url = `${API_BASE}/api/shifts/today`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch shifts: HTTP ${res.status}${text ? `: ${text}` : ''}`);
  }
  const json: any = await res.json().catch(() => ({}));
  const stores: ShiftStore[] = Array.isArray(json?.stores) ? json.stores : [];
  return {
    date: String(json?.date ?? ''),
    total_employees: Number(json?.total_employees ?? 0),
    stores,
  };
}


