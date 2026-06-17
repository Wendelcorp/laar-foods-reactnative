import { API_BASE, buildAuthHeaders } from '../config/api';

export interface GoogleReview {
  review_id?: string | null;
  author: string;
  text: string;
  date: string;
  rating: number;
}

export interface GoogleReviewStore {
  store_number: string;
  average_rating?: number | null;
  total_review_count?: number | null;
  scanned_review_count?: number | null;
  reviews: GoogleReview[];
}

export interface GoogleReviewsResponse {
  fetched_at: string;
  review_scan_limit: number;
  stores: GoogleReviewStore[];
}

export async function fetchGoogleReviews(): Promise<GoogleReviewsResponse> {
  const headers = await buildAuthHeaders();
  const res = await fetch(`${API_BASE}/api/google_reviews?limit=5&scan_limit=25`, { headers });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    let text = body;
    try {
      const json = JSON.parse(body);
      text = json?.error || json?.message || body;
    } catch {}
    throw new Error(`Failed to fetch Google reviews: HTTP ${res.status}${text ? `: ${text}` : ''}`);
  }

  const json: any = await res.json().catch(() => ({}));
  return {
    fetched_at: String(json?.fetched_at ?? ''),
    review_scan_limit: Number(json?.review_scan_limit ?? 25),
    stores: Array.isArray(json?.stores) ? json.stores : [],
  };
}
