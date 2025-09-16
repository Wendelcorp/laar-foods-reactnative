import { API_BASE, getApiKey } from '../config/api';

export interface GenerateLetterParams {
  employee_number: string;
  workplace_address: string;
  full_time: boolean;
}

/**
 * Calls the backend to generate an employment letter PDF and returns it as an ArrayBuffer.
 */
export async function generateEmploymentLetter(params: GenerateLetterParams): Promise<ArrayBuffer> {
  const apiKey = await getApiKey();
  const url = `${API_BASE}/api/letters/generate`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to generate letter: HTTP ${res.status}${text ? `: ${text}` : ''}`);
  }
  // Expecting PDF binary
  const buf = await res.arrayBuffer();
  return buf;
}

/**
 * Lightweight base64 encoder for ArrayBuffer (avoids extra deps).
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null as unknown as number[], Array.from(sub));
  }
  // btoa is available in React Native runtime
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return global.btoa ? global.btoa(binary) : btoa(binary);
}


