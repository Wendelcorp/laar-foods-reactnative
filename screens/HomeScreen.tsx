import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { AppHeader } from '../components/AppHeader';
import { StatusBadge, BadgeType } from '../components/StatusBadge';
import { StoreCard } from '../components/StoreCard';
import { StoreCardHeader } from '../components/StoreCardHeader';
import { colors, radius, spacing } from '../theme';

type SalesStore = {
  store_id: number;
  store_value: string;
  last_year_sales: number;
  this_year_sales: number;
  variance: string;
  delivery: number | null;
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
};

type GpsStore = {
  store_id: string;
  store_name: string;
  am: { value: string; color_code: string };
  pm: { value: string; color_code: string };
  brunch: { value: string; color_code: string };
};

type GpsResponse = {
  date: string;
  pretty_date: string;
  stores: GpsStore[];
};

type NightDeliveryStore = {
  store_number: string;
  night_sales: number;
  scraped_at: string;
};

type NightDeliveriesResponse = {
  date: string;
  pretty_date: string;
  stores: NightDeliveryStore[];
  total_night_sales: number;
};

const NIGHT_DELIVERY_STORE_IDS = new Set([6, 941]);

type HomeScreenProps = {
  apiKey: string | null;
};

const API_BASE = 'https://laar-foods-app-f5dacb5702ee.herokuapp.com';
const SECURE_KEY = 'LIVE_GPS_API_KEY';

function findGpsStore(stores: GpsStore[] | undefined, salesStore: SalesStore): GpsStore | undefined {
  if (!stores?.length) return undefined;
  const storeId = String(salesStore.store_id);
  return stores.find(
    (store) =>
      store.store_name === storeId ||
      String(store.store_id) === storeId ||
      Number(store.store_name) === salesStore.store_id,
  );
}

function colorCodeToBadge(code?: string): BadgeType {
  switch (code) {
    case 'green':
      return 'success';
    case 'yellow':
      return 'warning';
    case 'red':
      return 'error';
    default:
      return 'neutral';
  }
}

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function parseVariancePercent(variance: string): number {
  const trimmed = variance.trim();
  const isParenthesized = trimmed.startsWith('(') && trimmed.includes(')');
  const num = parseFloat(trimmed.replace(/[()%]/g, ''));
  if (Number.isNaN(num)) return 0;
  if (isParenthesized) return -Math.abs(num);
  return num;
}

function formatVariancePercent(value: number) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export default function HomeScreen({ apiKey }: HomeScreenProps) {
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sales, setSales] = React.useState<SalesResponse | null>(null);
  const [gps, setGps] = React.useState<GpsResponse | null>(null);
  const [nightDeliveries, setNightDeliveries] = React.useState<NightDeliveriesResponse | null>(
    null,
  );
  const [salesPolledAt, setSalesPolledAt] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async (opts?: { isRefresh?: boolean }) => {
    const resolvedKey = apiKey ?? (await SecureStore.getItemAsync(SECURE_KEY));
    if (!resolvedKey) return;
    if (!opts?.isRefresh) setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().slice(0, 10);
      const headers = { 'X-Api-Key': resolvedKey };
      const [salesRes, gpsRes, nightRes] = await Promise.allSettled([
        axios.get<SalesResponse>(`${API_BASE}/api/live_report?date=${today}`, {
          headers,
          timeout: 15000,
        }),
        axios.get<GpsResponse>(`${API_BASE}/api/live_gps_report`, {
          headers,
          timeout: 15000,
        }),
        axios.get<NightDeliveriesResponse>(`${API_BASE}/api/night_deliveries/last_night`, {
          headers,
          timeout: 15000,
        }),
      ]);

      if (salesRes.status === 'fulfilled') {
        setSales(salesRes.value.data);
        const bodyPolled =
          (salesRes.value.data as any)?.created_at ||
          (salesRes.value.data as any)?.polled_at ||
          (salesRes.value.data as any)?.polledAt ||
          null;
        const headerPolled =
          (salesRes.value.headers as any)?.['x-polled-at'] ||
          (salesRes.value.headers as any)?.['date'] ||
          null;
        const polledRaw = bodyPolled || headerPolled || new Date().toISOString();
        let s = String(polledRaw);
        s = s.replace(/\s[A-Z]{2,5}\s(?=[+-]\d{2}:?\d{2})/, ' ');
        s = s.replace(/(\d{2}:\d{2}:\d{2})\.(\d{3})\d+/, '$1.$2');
        let d = new Date(s);
        if (Number.isNaN(d.getTime())) {
          s = s.replace(/(\d{2}:\d{2}:\d{2})\..*?(?=\s|$)/, '$1');
          d = new Date(s);
        }
        const display = Number.isNaN(d.getTime()) ? new Date() : d;
        setSalesPolledAt(display.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      } else {
        const e = salesRes.reason;
        const body = e?.response?.data;
        setError(body?.error || body?.message || e?.message || 'Failed to fetch sales');
      }

      if (gpsRes.status === 'fulfilled') {
        setGps(gpsRes.value.data);
      }

      if (nightRes.status === 'fulfilled') {
        setNightDeliveries(nightRes.value.data);
      }
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData({ isRefresh: true }).finally(() => setRefreshing(false));
  }, [fetchData]);

  const storesSorted = React.useMemo(() => {
    const arr = sales?.stores ?? [];
    return [...arr].sort((a, b) => {
      if (a.store_id === 6) return -1;
      if (b.store_id === 6) return 1;
      return a.store_id - b.store_id;
    });
  }, [sales]);

  const nightDeliveryByStoreId = React.useMemo(() => {
    const map = new Map<number, number>();
    for (const store of nightDeliveries?.stores ?? []) {
      const storeId = Number(store.store_number);
      if (!Number.isNaN(storeId)) {
        map.set(storeId, store.night_sales);
      }
    }
    return map;
  }, [nightDeliveries]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const percentVariance = sales?.totals.change_percent ?? 0;
  const isPositive = percentVariance >= 0;

  const renderStore = ({ item }: { item: SalesStore }) => {
    const variance = parseVariancePercent(item.variance);
    const storePositive = variance >= 0;
    const gpsStore = findGpsStore(gps?.stores, item);
    const hasDelivery = item.delivery != null && !Number.isNaN(item.delivery);
    const nightDelivery = nightDeliveryByStoreId.get(item.store_id);
    const hasNightDelivery =
      NIGHT_DELIVERY_STORE_IDS.has(item.store_id) &&
      nightDelivery != null &&
      !Number.isNaN(nightDelivery);

    return (
      <View style={styles.storeSection}>
        <StoreCard variant="hero">
          <StoreCardHeader
            storeId={item.store_id}
            trailing={
              salesPolledAt ? (
                <Text style={styles.polledAt}>Polled At {salesPolledAt}</Text>
              ) : undefined
            }
          />

          <View style={styles.metricRow}>
            <View>
              <Text style={styles.metricLabel}>Last Year</Text>
              <Text style={styles.metricValue}>{formatCurrency(item.last_year_sales)}</Text>
            </View>
            <View style={styles.metricRight}>
              <Text style={styles.metricLabel}>This Year</Text>
              <Text style={styles.metricValue}>{formatCurrency(item.this_year_sales)}</Text>
            </View>
          </View>

          <View style={styles.varianceBox}>
            <Text style={styles.varianceLabel}>Variance</Text>
            <Text
              style={[
                styles.varianceValue,
                { color: storePositive ? colors.statusSuccess : colors.statusError },
              ]}
            >
              {formatVariancePercent(variance)}
            </Text>
          </View>

          {hasDelivery || hasNightDelivery ? (
            <View style={hasNightDelivery ? styles.deliveryRow : styles.deliverySection}>
              {hasDelivery ? (
                <View>
                  <Text style={styles.metricLabel}>Delivery</Text>
                  <Text style={styles.metricValue}>{formatCurrency(item.delivery)}</Text>
                </View>
              ) : (
                <View />
              )}
              {hasNightDelivery ? (
                <View style={styles.metricRight}>
                  <Text style={styles.metricLabel}>Night Delivery</Text>
                  <Text style={styles.metricValue}>{formatCurrency(nightDelivery)}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {gpsStore ? (
            <View style={styles.gpsBadges}>
              <StatusBadge type={colorCodeToBadge(gpsStore.am?.color_code)}>
                AM {gpsStore.am?.value ?? '-'}
              </StatusBadge>
              <StatusBadge type={colorCodeToBadge(gpsStore.brunch?.color_code)}>
                BR {gpsStore.brunch?.value ?? '-'}
              </StatusBadge>
              <StatusBadge type={colorCodeToBadge(gpsStore.pm?.color_code)}>
                PM {gpsStore.pm?.value ?? '-'}
              </StatusBadge>
            </View>
          ) : null}
        </StoreCard>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader
        title={currentDate}
        action={
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons
              name="refresh"
              size={20}
              color={colors.primary}
              style={refreshing ? styles.spinning : undefined}
            />
          </TouchableOpacity>
        }
      />

      {loading && !sales ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : error && !sales ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchData()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={storesSorted}
          keyExtractor={(item) => String(item.store_id)}
          renderItem={renderStore}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            sales ? (
              <View style={styles.summaryCard}>
                <View style={styles.summaryTop}>
                  <View>
                    <Text style={styles.summaryLabel}>Net Sales</Text>
                    <Text style={styles.summaryHero}>{formatCurrency(sales.totals.this_year)}</Text>
                  </View>
                  <View style={styles.summaryRight}>
                    <Text style={styles.summaryLabel}>Delivery</Text>
                    <Text style={styles.summaryHero}>{formatCurrency(sales.totals.delivery)}</Text>
                  </View>
                </View>
                <View style={styles.summaryBottom}>
                  <Text style={styles.summaryLabel}>Variance YoY</Text>
                  <Text
                    style={[
                      styles.varianceHero,
                      { color: isPositive ? colors.statusSuccess : colors.statusError },
                    ]}
                  >
                    {formatVariancePercent(percentVariance)}
                  </Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.centerBox}>
                <Text style={styles.muted}>No data</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDefault,
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  spinning: {
    opacity: 0.5,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xxl,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: radius.xl,
    padding: spacing.xxl,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  summaryHero: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  summaryBottom: {
    alignItems: 'center',
  },
  varianceHero: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -1,
  },
  storeSection: {
    marginBottom: spacing.xl,
  },
  polledAt: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  metricRight: {
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  varianceBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  varianceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  varianceValue: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  deliverySection: {
    marginBottom: spacing.xl,
  },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  gpsBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: spacing.sm,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  muted: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  errorText: {
    color: colors.statusError,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
