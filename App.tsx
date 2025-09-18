import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, AppState, Modal, Alert, ScrollView } from 'react-native';
import ZenputScreen from './screens/ZenputScreen';
import LabourScreen from './screens/LabourScreen';
import OnShiftScreen from './screens/OnShiftScreen';
import ContactsScreen from './screens/ContactsScreen';
import JobLetterScreen from './screens/JobLetterScreen';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

type SalesStore = {
  store_id: number;
  store_value: string;
  last_year_sales: number;
  this_year_sales: number;
  variance: string; // e.g. "8.52%"
  delivery: number | null;
  labour_percent: number;
  hours_used: number;
  hours_allowed: number;
  waste: number;
};

type SalesTotals = {
  last_year: number;
  this_year: number;
  variance: number;
  change_percent: number;
  delivery: number;
};

type SalesResponse = {
  date: string;
  pretty_date: string;
  stores: SalesStore[];
  totals: SalesTotals;
  created_at?: string;
  polled_at?: string;
  polledAt?: string;
};

type GpsTimeBlock = {
  label: string;
  value: string;
  color_code: 'green' | 'yellow' | 'red' | string;
};

type GpsStore = {
  store_id: string;
  store_name: string;
  late_night: string;
  brunch: { value: string; color_code: string };
  date: string;
  pretty_date: string;
  am: GpsTimeBlock;
  pm: GpsTimeBlock;
};

type GpsResponse = {
  success?: boolean;
  date: string;
  pretty_date: string;
  stores: GpsStore[];
};

const SECURE_KEY = 'LIVE_GPS_API_KEY';
const ZENPUT_COOKIE_KEY = 'ZENPUT_COOKIE';

const colorFor = (code?: string) => {
  switch (code) {
    case 'green':
      return '#22c55e';
    case 'yellow':
      return '#eab308';
    case 'red':
      return '#ef4444';
    default:
      return '#64748b';
  }
};

export default function App() {
  const [apiKey, setApiKey] = React.useState<string | null>(null);
  const [editingKey, setEditingKey] = React.useState<string>('');
  const [keyPromptDismissed, setKeyPromptDismissed] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<GpsResponse | null>(null);
  const [sales, setSales] = React.useState<SalesResponse | null>(null);
  const [activeTab, setActiveTab] = React.useState<'gps' | 'sales'>('sales');
  const [salesPolledAt, setSalesPolledAt] = React.useState<string | null>(null);
  const [menuVisible, setMenuVisible] = React.useState<boolean>(false);
  const [logsVisible, setLogsVisible] = React.useState<boolean>(false);
  const [labourVisible, setLabourVisible] = React.useState<boolean>(false);
  const [onShiftVisible, setOnShiftVisible] = React.useState<boolean>(false);
  const [contactsVisible, setContactsVisible] = React.useState<boolean>(false);
  const [jobLetterVisible, setJobLetterVisible] = React.useState<boolean>(false);
  const [zenputCookie, setZenputCookie] = React.useState<string | null>(null);
  const [cookieEditing, setCookieEditing] = React.useState<string>('');
  const [logsLoading, setLogsLoading] = React.useState<boolean>(false);
  const [logsError, setLogsError] = React.useState<string | null>(null);
  const [logsData, setLogsData] = React.useState<Array<{ storeId: number; storeName: string; items: Array<{ title: string; completion: number | null }> }>>([]);

  React.useEffect(() => {
    (async () => {
      const existing = await SecureStore.getItemAsync(SECURE_KEY);
      if (existing) {
        setApiKey(existing);
      }
    })();
  }, []);

  const saveKey = React.useCallback(async () => {
    if (!editingKey.trim()) return;
    await SecureStore.setItemAsync(SECURE_KEY, editingKey.trim());
    setApiKey(editingKey.trim());
  }, [editingKey]);

  const clearKey = React.useCallback(async () => {
    await SecureStore.deleteItemAsync(SECURE_KEY);
    setApiKey(null);
    setData(null);
  }, []);

  const fetchGps = React.useCallback(async (opts?: { isRefresh?: boolean }) => {
    if (!apiKey) return;
    if (!opts?.isRefresh) setLoading(true);
    setError(null);
    try {
      const res = await axios.get<GpsResponse>('https://laar-foods-app-f5dacb5702ee.herokuapp.com/api/live_gps_report', {
        headers: { 'X-Api-Key': apiKey },
        timeout: 15000,
      });
      setData(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  const fetchSales = React.useCallback(async () => {
    if (!apiKey) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await axios.get<SalesResponse>(`https://laar-foods-app-f5dacb5702ee.herokuapp.com/api/live_report?date=${today}` , {
        headers: { 'X-Api-Key': apiKey },
        timeout: 15000,
      });
      setSales(res.data);
      // Determine polled timestamp from response if available
      const bodyPolled = (res.data as any)?.created_at || (res.data as any)?.polled_at || (res.data as any)?.polledAt || null;
      const headerPolled = (res.headers as any)?.['x-polled-at'] || (res.headers as any)?.['date'] || null;
      const polledRaw = bodyPolled || headerPolled || new Date().toISOString();
      // Parse strings like: "Wed, 27 Aug 2025 15:32:54.741918000 EDT -04:00"
      let s = String(polledRaw);
      s = s.replace(/\s[A-Z]{2,5}\s(?=[+-]\d{2}:?\d{2})/, ' ');
      s = s.replace(/(\d{2}:\d{2}:\d{2})\.(\d{3})\d+/, '$1.$2');
      let d = new Date(s);
      if (Number.isNaN(d.getTime())) {
        s = s.replace(/(\d{2}:\d{2}:\d{2})\..*?(?=\s|$)/, '$1');
        d = new Date(s);
      }
      const display = Number.isNaN(d.getTime())
        ? new Date()
        : d;
      setSalesPolledAt(display.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    } catch (e) {
      // Keep silent; main error banner is driven by GPS fetch currently
    }
  }, [apiKey]);

  React.useEffect(() => {
    if (apiKey) {
      fetchGps();
      fetchSales();
    }
  }, [apiKey, fetchGps, fetchSales]);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        setRefreshing(true);
        Promise.all([
          fetchGps({ isRefresh: true }),
          fetchSales(),
        ]).finally(() => setRefreshing(false));
      }
    });
    return () => sub.remove();
  }, [fetchGps, fetchSales]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetchGps({ isRefresh: true }),
      fetchSales(),
    ]).finally(() => setRefreshing(false));
  }, [fetchGps, fetchSales]);

  const todayLabel = React.useMemo(() => {
    const d = new Date();
    try {
      return d
        .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        .replace(',', '');
    } catch {
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${weekdays[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`;
    }
  }, []);

  const handleMenuSelect = React.useCallback((label: string) => {
    switch (label) {
      case 'Home':
        setMenuVisible(false);
        setLogsVisible(false);
        setLabourVisible(false);
        setOnShiftVisible(false);
        setContactsVisible(false);
        setJobLetterVisible(false);
        break;
      case 'Change Key':
        setMenuVisible(false);
        setKeyPromptDismissed(false);
        clearKey();
        break;
      case 'Logs':
        setMenuVisible(false);
        setLogsVisible(true);
        break;
      case 'Labour':
        setMenuVisible(false);
        setLabourVisible(true);
        break;
      case 'On Shift':
        setMenuVisible(false);
        setOnShiftVisible(true);
        break;
      case 'Contacts':
        setMenuVisible(false);
        setContactsVisible(true);
        break;
      case 'Job Letter':
        setMenuVisible(false);
        setJobLetterVisible(true);
        break;
      default:
        setMenuVisible(false);
        // Placeholder for future navigation
        Alert.alert(label);
    }
  }, [clearKey]);

  const gpsStoresSorted = React.useMemo(() => {
    const arr = data?.stores ?? [];
    return [...arr].sort((a, b) => {
      const aIs6 = Number(a.store_name) === 6 || a.store_id === '6';
      const bIs6 = Number(b.store_name) === 6 || b.store_id === '6';
      if (aIs6 && !bIs6) return -1;
      if (!aIs6 && bIs6) return 1;
      return 0;
    });
  }, [data]);

  const salesStoresSorted = React.useMemo(() => {
    const arr = sales?.stores ?? [];
    return [...arr].sort((a, b) => {
      const aIs6 = a.store_id === 6;
      const bIs6 = b.store_id === 6;
      if (aIs6 && !bIs6) return -1;
      if (!aIs6 && bIs6) return 1;
      return 0;
    });
  }, [sales]);

  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
    } catch {
      return `$${value.toFixed(2)}`;
    }
  };

  const varianceColor = (percentStr?: string) => {
    if (!percentStr) return '#64748b';
    const num = parseFloat(percentStr.replace('%', ''));
    if (Number.isNaN(num)) return '#64748b';
    return num >= 0 ? '#22c55e' : '#ef4444';
  };

  const formatNumber = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    try {
      return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    } catch {
      return String(value?.toFixed ? value.toFixed(2) : value);
    }
  };

  // ---------- Logs (Zenput) helpers ----------
  React.useEffect(() => {
    (async () => {
      const cookie = await SecureStore.getItemAsync(ZENPUT_COOKIE_KEY);
      if (cookie) setZenputCookie(cookie);
    })();
  }, []);

  function getCsrfFromCookie(cookie: string): string | null {
    const match = /(?:^|;\s*)csrftoken=([^;]+)/i.exec(cookie);
    return match ? decodeURIComponent(match[1]) : null;
  }

  async function fetchJson(url: string, cookie: string): Promise<any> {
    const csrf = getCsrfFromCookie(cookie) || '';
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Host': 'www.zenput.com',
        'Origin': 'zenput://www.zenput.com',
        'Referer': 'zenput://www.zenput.com',
        'x-zenput-mobile': '24.8.20',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) zenput:app_version=24.8.20;platform_type=iOS;platform_version=15.6',
        'Accept-Language': 'en-CA,en-US;q=0.9,en;q=0.8',
        'Connection': 'keep-alive',
        'Cookie': cookie,
        'X-CSRFToken': csrf,
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ''}`);
    }
    return res.json();
  }

  function cleanTitle(title: string): string {
    let cleaned = `${title}`;
    if (cleaned.includes(' / ')) cleaned = cleaned.split(' / ')[0];
    cleaned = cleaned
      .replace(/\s*-\s*EN\/FR_CAN\b/g, '')
      .replace(/\bEN\/FR_CAN\b/g, '')
      .replace(/\s*-\s*EN\b/g, '')
      .replace(/\s*_CAN\b/gi, '')
      .replace(/\s*-\s*Accuracy Check BIL\b/gi, '')
      .trim();

    const shortAliases: Array<[RegExp, string]> = [
      [/^PM End of Day Checklist\b.*$/i, 'PM EOD Checklist'],
      [/^Interior\/Exterior Area Inspection$/i, 'Area Inspection'],
      [/^Calibration - (.+)$/i, 'Cal. $1'],
    ];
    for (const [pattern, replacement] of shortAliases) {
      if (pattern.test(cleaned)) {
        cleaned = cleaned.replace(pattern, replacement);
        break;
      }
    }
    return cleaned;
  }

  async function fetchZenputLogs(cookie: string) {
    // Auth poke
    try {
      await fetchJson('https://www.zenput.com/api/v3/users/current/zendesk_auth/', cookie);
    } catch {}

    const storesResp = await fetchJson('https://www.zenput.com/api/v1/users/groups_and_accounts/?start=0&limit=100&order_by=name&search_by=accounts', cookie);
    const results: Array<{ storeId: number; storeName: string; items: Array<{ title: string; completion: number | null }> }> = [];
    if (storesResp && Array.isArray(storesResp.results)) {
      for (const store of storesResp.results) {
        if (store?.type !== 'account') continue;
        const storeId = store.id as number;
        const storeName = store.name as string;
        let projects: any = null;
        try {
          projects = await fetchJson(`https://www.zenput.com/api/v3/projects/parents_recurring_form/location/${storeId}/?start=0&limit=20&order_by=title`, cookie);
        } catch (e) {
          continue; // skip store on auth/permission error
        }
        const items: Array<{ title: string; completion: number | null }> = [];
        if (projects && Array.isArray(projects.data)) {
          for (const project of projects.data) {
            const projectId = project.id;
            const title = cleanTitle(project.title);
            const completion = await fetchJson(`https://www.zenput.com/api/v3/tasks/completion_rate/location/${storeId}/?parent_project_id=${projectId}&date_start=2024-08-16T00%3A00%3A00.000Z&date_end=2024-09-14T23%3A59%3A59.999Z`, cookie).catch(() => null);
            let pct: number | null = null;
            if (completion && completion.data && completion.data.completion_rate != null) {
              pct = Math.round(Number(completion.data.completion_rate) * 100);
            }
            items.push({ title, completion: pct });
          }
        }
        results.push({ storeId, storeName, items });
      }
    }
    return results;
  }

  if (!apiKey && !keyPromptDismissed) {
    return (
      <SafeAreaView style={styles.containerCenter}>
        <Text style={styles.title}>Enter API Key</Text>
        <TextInput
          value={editingKey}
          onChangeText={setEditingKey}
          placeholder="X-Api-Key"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          style={styles.input}
        />
        <TouchableOpacity onPress={saveKey} style={styles.button}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setKeyPromptDismissed(true)} style={[styles.secondaryButton, { marginTop: 10 }]}>
          <Text style={styles.secondaryButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{todayLabel}</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.iconButton}>
          <View style={styles.hamburgerBar} />
          <View style={styles.hamburgerBar} />
          <View style={styles.hamburgerBar} />
        </TouchableOpacity>
      </View>

      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <View style={styles.menuOverlay}>
          <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setMenuVisible(false)} />
          <View style={styles.menuPanel}>
            {[
              { label: 'Home' },
              { label: 'Labour' },
              { label: 'Inventory', disabled: true },
              { label: 'Logs' },
              { label: 'On Shift' },
              { label: 'Job Letter' },
              { label: 'Contacts' },
              { label: 'Calibration', disabled: true },
              { label: 'Filters', disabled: true },
              { label: 'Change Key' },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, item.disabled && { opacity: 0.4 }]}
                onPress={() => handleMenuSelect(item.label)}
                disabled={!!item.disabled}
              >
                <Text style={[styles.menuItemText, item.disabled && styles.menuItemTextDisabled]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Logs Modal renders ZenputScreen */}
      <Modal visible={logsVisible} animationType="slide" onRequestClose={() => setLogsVisible(false)}>
        <SafeAreaView style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Logs</Text>
            <TouchableOpacity onPress={() => setLogsVisible(false)} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          <ZenputScreen embedded />
        </SafeAreaView>
      </Modal>

      {/* Labour Modal */}
      <Modal visible={labourVisible} animationType="slide" onRequestClose={() => setLabourVisible(false)}>
        <LabourScreen onClose={() => setLabourVisible(false)} />
      </Modal>

      {/* On Shift Modal */}
      <Modal visible={onShiftVisible} animationType="slide" onRequestClose={() => setOnShiftVisible(false)}>
        <OnShiftScreen onClose={() => setOnShiftVisible(false)} />
      </Modal>

      {/* Contacts Modal */}
      <Modal visible={contactsVisible} animationType="slide" onRequestClose={() => setContactsVisible(false)}>
        <ContactsScreen onClose={() => setContactsVisible(false)} />
      </Modal>

      {/* Job Letter Modal */}
      <Modal visible={jobLetterVisible} animationType="slide" onRequestClose={() => setJobLetterVisible(false)}>
        <JobLetterScreen onClose={() => setJobLetterVisible(false)} />
      </Modal>
      <View style={styles.tabRow}>
        {/* <TouchableOpacity onPress={() => setActiveTab('gps')} style={[styles.tabButton, activeTab === 'gps' && styles.tabButtonActive]}>
          <Text style={[styles.tabButtonText, activeTab === 'gps' && styles.tabButtonTextActive]}>GPS</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('sales')} style={[styles.tabButton, activeTab === 'sales' && styles.tabButtonActive]}>
          <Text style={[styles.tabButtonText, activeTab === 'sales' && styles.tabButtonTextActive]}>Sales</Text>
        </TouchableOpacity> */}
      </View>

      {loading && !data ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchGps()} style={styles.button}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : activeTab === 'gps' ? (
        <FlatList
          data={gpsStoresSorted}
          keyExtractor={(item) => item.store_id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            data ? (
              <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                {/* <Text style={styles.subTitle}>{data.pretty_date}</Text> */}
                {sales ? (
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalPill}>LY {formatCurrency(sales.totals.last_year)}</Text>
                    <Text style={styles.totalPill}>TY {formatCurrency(sales.totals.this_year)}</Text>
                    <Text style={styles.totalPill}>Δ {formatCurrency(sales.totals.variance)}</Text>
                    <Text style={styles.totalPill}>{sales.totals.change_percent.toFixed(2)}%</Text>
                  </View>
                ) : null}
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Store {item.store_name}</Text>
                <Text style={styles.cardId}>#{item.store_id}</Text>
              </View>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: colorFor(item.am.color_code) }]}>
                  <Text style={styles.badgeText}>{item.am.label}: {item.am.value}%</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colorFor(item.pm.color_code) }]}>
                  <Text style={styles.badgeText}>{item.pm.label}: {item.pm.value}%</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colorFor(item.brunch.color_code) }]}>
                  <Text style={styles.badgeText}>Brunch: {item.brunch.value}%</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: '#334155' }]}>
                  <Text style={styles.badgeText}>Late: {item.late_night}%</Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={!loading ? (
            <View style={styles.centerBox}>
              <Text style={styles.muted}>No data</Text>
            </View>
          ) : null}
        />
      ) : (
        <FlatList
          data={salesStoresSorted}
          keyExtractor={(item) => String(item.store_id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            sales ? (
              <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                {/* <Text style={styles.subTitle}>{sales.pretty_date}</Text> */}
                <View style={styles.totalsRow}>
                  {(() => {
                    const isUp = sales.totals.change_percent >= 0;
                    const color = isUp ? '#22c55e' : '#ef4444';
                    return (
                      <>
                        <Text style={[styles.totalPill, { color }]}>S: {formatCurrency(sales.totals.this_year)}</Text>
                        <Text style={[styles.totalPill, { color }]}>D: {formatCurrency(sales.totals.variance)}</Text>
                        <Text style={[styles.totalPill, { color }]}>V: {sales.totals.change_percent.toFixed(2)}%</Text>
                      </>
                    );
                  })()}
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={{ marginVertical: 14 }}>
              <View style={styles.salesHeaderRow}>
                <Text style={styles.salesStoreId}>{item.store_id}</Text>
                {salesPolledAt ? (
                  <View style={styles.polledRow}>
                    <Text style={styles.polledLabel}>Polled At</Text>
                    <Text style={styles.polledTime}>{salesPolledAt}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.outlineCard}>
                <View style={styles.rowSpaceBetween}>
                  <View style={styles.columnCenter}>
                    <Text style={styles.mutedLabel}>Last Year</Text>
                    <Text style={styles.valueDefault}>{formatNumber(item.last_year_sales)}</Text>
                  </View>
                  <View style={styles.columnCenter}>
                    <Text style={styles.mutedLabel}>This Year</Text>
                    <Text style={styles.valueDefault}>{formatNumber(item.this_year_sales)}</Text>
                  </View>
                </View>
                <View style={styles.centerVarianceBox}>
                  <Text style={styles.mutedLabel}>Variance</Text>
                  <Text style={[styles.varianceValue, { color: varianceColor(item.variance) }]}>{item.variance}</Text>
                </View>
                <View style={styles.rowSpaceBetween}>
                  <View style={styles.columnCenter}>
                    <Text style={styles.mutedLabel}>Delivery</Text>
                    <Text style={styles.valueDefault}>{formatNumber(item.delivery)}</Text>
                  </View>
                  {/* Optional: Last Hour if provided in API in future */}
                </View>
                {(() => {
                  const gps = data?.stores?.find((s) => s.store_name === String(item.store_id));
                  if (!gps) return null;
                  return (
                    <View style={[styles.badgeRow, { marginTop: 10, justifyContent: 'center' }]}>
                      <View style={[styles.badge, { backgroundColor: colorFor(gps.am.color_code) }]}>
                        <Text style={styles.badgeText}>AM {gps.am.value}%</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: colorFor(gps.brunch.color_code) }]}>
                        <Text style={styles.badgeText}>BR {gps.brunch.value}%</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: colorFor(gps.pm.color_code) }]}>
                        <Text style={styles.badgeText}>PM {gps.pm.value}%</Text>
                      </View>
                    </View>
                  );
                })()}
              </View>
            </View>
          )}
          ListEmptyComponent={!loading ? (
            <View style={styles.centerBox}>
              <Text style={styles.muted}>No data</Text>
            </View>
          ) : null}
        />
      )}

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  containerCenter: {
    flex: 1,
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '700',
  },
  subTitle: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#334155',
    color: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  button: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontWeight: '600',
    marginBottom: 12,
  },
  secondaryButton: {
    borderColor: '#334155',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 12,
  },
  iconButton: {
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  hamburgerBar: {
    width: 22,
    height: 2,
    backgroundColor: '#334155',
    borderRadius: 2,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  muted: {
    color: '#6b7280',
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  totalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    justifyContent: 'center',
  },
  totalPill: {
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16,
  },
  cardId: {
    color: '#6b7280',
    fontSize: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  tabRow: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderColor: '#0ea5e9',
  },
  tabButtonText: {
    color: '#334155',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#0ea5e9',
  },
  salesHeaderRow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  salesStoreId: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0f172a',
  },
  polledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  polledLabel: {
    color: '#9ca3af',
    fontWeight: '700',
  },
  polledTime: {
    color: '#0f172a',
    fontWeight: '700',
  },
  outlineCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  columnCenter: {
    alignItems: 'center',
  },
  mutedLabel: {
    color: '#9ca3af',
    fontWeight: '700',
    marginBottom: 6,
  },
  valuePositive: {
    color: '#34d399',
    fontWeight: '700',
    fontSize: 22,
  },
  valueDefault: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 22,
  },
  centerVarianceBox: {
    alignItems: 'center',
    marginVertical: 6,
  },
  varianceValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
  },
  menuBackdrop: {
    flex: 1,
  },
  menuPanel: {
    position: 'absolute',
    top: 60,
    right: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    borderColor: '#e5e7eb',
    borderWidth: 1,
    paddingVertical: 8,
    width: 220,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  menuItemText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  menuItemTextDisabled: {
    color: '#9ca3af',
  },
});

