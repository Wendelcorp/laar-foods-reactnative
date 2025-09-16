import * as SecureStore from 'expo-secure-store';

// Central API configuration for the Laar backend
export const API_BASE = 'https://laar-foods-app-f5dacb5702ee.herokuapp.com';

// We already store the X-Api-Key for other endpoints under this key
const SECURE_KEY = 'LIVE_GPS_API_KEY';

export async function getApiKey(): Promise<string> {
  const stored = await SecureStore.getItemAsync(SECURE_KEY);
  return stored || 'devkey';
}

export async function buildAuthHeaders(): Promise<Record<string, string>> {
  const key = await getApiKey();
  return { 'X-Api-Key': key, 'Accept': 'application/json' };
}


