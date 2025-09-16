import { API_BASE, buildAuthHeaders } from '../config/api';

export interface Contact {
  id: number;
  name: string;
  phone_number: string;
  category?: string | null;
}

export async function listContacts(): Promise<Contact[]> {
  const headers = await buildAuthHeaders();
  const res = await fetch(`${API_BASE}/api/contacts`, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to list contacts: HTTP ${res.status}${text ? `: ${text}` : ''}`);
  }
  return res.json();
}

export async function createContact(input: { name: string; phone_number: string; category?: string | null }): Promise<Contact> {
  const headers = await buildAuthHeaders();
  const res = await fetch(`${API_BASE}/api/contacts`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ contact: input }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to create contact: HTTP ${res.status}${text ? `: ${text}` : ''}`);
  }
  return res.json();
}

export async function updateContact(id: number, attrs: Partial<Omit<Contact, 'id'>>): Promise<Contact> {
  const headers = await buildAuthHeaders();
  const res = await fetch(`${API_BASE}/api/contacts/${id}` , {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ contact: attrs }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to update contact: HTTP ${res.status}${text ? `: ${text}` : ''}`);
  }
  return res.json();
}

export async function deleteContact(id: number): Promise<void> {
  const headers = await buildAuthHeaders();
  const res = await fetch(`${API_BASE}/api/contacts/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to delete contact: HTTP ${res.status}${text ? `: ${text}` : ''}`);
  }
}


