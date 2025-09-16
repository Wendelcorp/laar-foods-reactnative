#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_BASE = process.env.LAAR_API_URL || 'https://laar-foods-app-f5dacb5702ee.herokuapp.com';
const API_KEY = process.env.LAAR_API_KEY || 'devkey';

function splitCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  values.push(current.trim());
  return values.map((v) => {
    const hasQuotes = v.startsWith('"') && v.endsWith('"');
    return hasQuotes ? v.slice(1, -1).trim() : v;
  });
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const nameIdx = header.findIndex((h) => h.includes('company') || h.includes('contact') || h === 'name');
  const phoneIdx = header.findIndex((h) => h.includes('phone'));
  const categoryIdx = header.findIndex((h) => h.includes('category'));
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]);
    const name = nameIdx >= 0 ? (cols[nameIdx] || '').trim() : '';
    const phone = phoneIdx >= 0 ? (cols[phoneIdx] || '').trim() : '';
    const category = categoryIdx >= 0 ? (cols[categoryIdx] || '').trim() : '';
    if (!name && !phone) continue;
    rows.push({ name, phone_number: phone, category: category || undefined });
  }
  return rows;
}

async function main() {
  const fileArg = process.argv[2] || 'phone_list.csv';
  const filePath = path.isAbsolute(fileArg) ? fileArg : path.join(process.cwd(), fileArg);
  if (!fs.existsSync(filePath)) {
    console.error(`CSV not found: ${filePath}`);
    process.exit(1);
  }
  const csv = fs.readFileSync(filePath, 'utf8');
  const rows = parseCsv(csv);
  if (rows.length === 0) {
    console.log('No rows found in CSV.');
    return;
  }
  console.log(`Parsed ${rows.length} rows from ${path.basename(filePath)}.`);

  const client = axios.create({ baseURL: API_BASE, headers: { 'X-Api-Key': API_KEY } });
  const existingResp = await client.get('/api/contacts');
  const existing = Array.isArray(existingResp.data) ? existingResp.data : [];
  const existingSet = new Set(existing.map((c) => `${(c.name || '').trim().toLowerCase()}|${(c.phone_number || '').replace(/\D+/g, '')}`));

  let created = 0;
  let skipped = 0;
  for (const row of rows) {
    const key = `${(row.name || '').trim().toLowerCase()}|${(row.phone_number || '').replace(/\D+/g, '')}`;
    if (existingSet.has(key)) {
      skipped += 1;
      continue;
    }
    try {
      await client.post('/api/contacts', { contact: { name: row.name, phone_number: row.phone_number, category: row.category } }, { headers: { 'Content-Type': 'application/json' } });
      created += 1;
      // Avoid hammering the API
      await new Promise((r) => setTimeout(r, 50));
    } catch (e) {
      console.error(`Failed to create contact for ${row.name} (${row.phone_number}):`, e.response?.status, e.response?.data || e.message);
    }
  }
  console.log(`Done. Created: ${created}. Skipped (duplicates): ${skipped}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});



