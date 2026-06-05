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
import { useNavigation } from '@react-navigation/native';
import {
  fetchNightDeliveriesHistory,
  type NightDeliveryDay,
  type NightDeliveriesHistoryResponse,
} from '../api/nightDeliveries';
import { AppHeader } from '../components/AppHeader';
import { StoreCard } from '../components/StoreCard';
import { colors, spacing } from '../theme';
import { sharedStyles } from '../styles/shared';

const TRACKED_STORE_IDS = [6, 941] as const;

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getStoreSales(day: NightDeliveryDay, storeId: number): number | null {
  const entry = day.stores.find((s) => Number(s.store_number) === storeId);
  if (!entry || Number.isNaN(entry.night_sales)) return null;
  return entry.night_sales;
}

function computeAverage(days: NightDeliveryDay[], storeId: number): number | null {
  const values: number[] = [];
  for (const day of days) {
    const sales = getStoreSales(day, storeId);
    if (sales != null) values.push(sales);
  }
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export default function NightDeliveryScreen() {
  const navigation = useNavigation();
  const [data, setData] = React.useState<NightDeliveriesHistoryResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAll = React.useCallback(async (opts?: { isRefresh?: boolean }) => {
    if (!opts?.isRefresh) setLoading(true);
    setError(null);
    try {
      const result = await fetchNightDeliveriesHistory();
      setData(result);
    } catch (e: any) {
      setError(e?.message || 'Failed to load night deliveries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAll({ isRefresh: true });
  }, [fetchAll]);

  const days = data?.stores ?? [];
  const avgByStore = React.useMemo(
    () =>
      Object.fromEntries(
        TRACKED_STORE_IDS.map((id) => [id, computeAverage(days, id)]),
      ) as Record<(typeof TRACKED_STORE_IDS)[number], number | null>,
    [days],
  );

  const headerAction = (
    <TouchableOpacity onPress={() => navigation.goBack()} style={sharedStyles.secondaryButton}>
      <Text style={sharedStyles.secondaryButtonText}>Back</Text>
    </TouchableOpacity>
  );

  const listHeader = data ? (
    <View style={styles.summarySection}>
      <Text style={styles.rangeLabel}>
        Last 30 days · {formatDate(data.start_date)} – {formatDate(data.end_date)}
      </Text>
      <View style={styles.summaryRow}>
        {TRACKED_STORE_IDS.map((storeId) => (
          <View key={storeId} style={styles.summaryCard}>
            <StoreCard>
              <Text style={sharedStyles.metricLabel}>Store {storeId} Avg</Text>
              <Text style={sharedStyles.metricValue}>{formatCurrency(avgByStore[storeId])}</Text>
            </StoreCard>
          </View>
        ))}
      </View>
    </View>
  ) : null;

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top']}>
      <AppHeader title="Night Delivery" action={headerAction} />

      {loading && !data ? (
        <View style={sharedStyles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={sharedStyles.muted}>Loading…</Text>
        </View>
      ) : error ? (
        <View style={sharedStyles.centerBox}>
          <Text style={sharedStyles.error}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={days}
          keyExtractor={(item) => item.date}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={sharedStyles.listContent}
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => {
            const store6 = getStoreSales(item, 6);
            const store941 = getStoreSales(item, 941);
            return (
              <StoreCard>
                <Text style={styles.dayLabel}>{formatDate(item.date)}</Text>
                <View style={styles.dayRow}>
                  <View style={styles.dayMetric}>
                    <Text style={sharedStyles.metricLabel}>Store 6</Text>
                    <Text style={styles.dayValue}>{formatCurrency(store6)}</Text>
                  </View>
                  <View style={styles.dayMetric}>
                    <Text style={sharedStyles.metricLabel}>Store 941</Text>
                    <Text style={styles.dayValue}>{formatCurrency(store941)}</Text>
                  </View>
                </View>
              </StoreCard>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            !loading ? (
              <View style={sharedStyles.centerBox}>
                <Text style={sharedStyles.muted}>No night delivery data</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  summarySection: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  rangeLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
  },
  dayLabel: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: spacing.md,
  },
  dayRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dayMetric: {
    flex: 1,
  },
  dayValue: {
    ...sharedStyles.metricValue,
    fontSize: 18,
  },
});
