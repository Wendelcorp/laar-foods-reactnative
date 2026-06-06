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
import { StoreCardHeader } from '../components/StoreCardHeader';
import { colors, spacing } from '../theme';
import { sharedStyles } from '../styles/shared';

const TRACKED_STORE_IDS = [6, 941] as const;

type StoreNightDelivery = {
  storeId: number;
  average: number | null;
  days: Array<{ date: string; night_sales: number }>;
};

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

function buildStoreSections(days: NightDeliveryDay[]): StoreNightDelivery[] {
  return TRACKED_STORE_IDS.map((storeId) => ({
    storeId,
    average: computeAverage(days, storeId),
    days: days
      .map((day) => {
        const sales = getStoreSales(day, storeId);
        if (sales == null) return null;
        return { date: day.date, night_sales: sales };
      })
      .filter((entry): entry is { date: string; night_sales: number } => entry != null),
  }));
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

  const storeSections = React.useMemo(
    () => buildStoreSections(data?.stores ?? []),
    [data?.stores],
  );

  const headerAction = (
    <TouchableOpacity onPress={() => navigation.goBack()} style={sharedStyles.secondaryButton}>
      <Text style={sharedStyles.secondaryButtonText}>Back</Text>
    </TouchableOpacity>
  );

  const renderStore = ({ item }: { item: StoreNightDelivery }) => (
    <View style={styles.storeSection}>
      <StoreCard variant="hero">
        <StoreCardHeader
          storeId={item.storeId}
          trailing={
            <View style={sharedStyles.summaryPill}>
              <Text style={sharedStyles.summaryPillText}>
                Avg {formatCurrency(item.average)}
              </Text>
            </View>
          }
        />
        {item.days.map((day, idx) => (
          <View
            key={day.date}
            style={[styles.dayRow, idx === item.days.length - 1 && styles.dayRowLast]}
          >
            <Text style={styles.dayLabel}>{formatDate(day.date)}</Text>
            <Text style={styles.dayValue}>{formatCurrency(day.night_sales)}</Text>
          </View>
        ))}
      </StoreCard>
    </View>
  );

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
          <TouchableOpacity onPress={() => fetchAll()} style={sharedStyles.primaryButton}>
            <Text style={sharedStyles.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={storeSections}
          keyExtractor={(item) => String(item.storeId)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={sharedStyles.listContent}
          ListHeaderComponent={
            data ? (
              <View style={styles.summaryHeader}>
                <Text style={styles.rangeLabel}>Last 30 days</Text>
                <Text style={styles.dateRange}>
                  {formatDate(data.start_date)} – {formatDate(data.end_date)}
                </Text>
              </View>
            ) : null
          }
          renderItem={renderStore}
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
  summaryHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  rangeLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  dateRange: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  storeSection: {
    marginBottom: spacing.xl,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  dayRowLast: {
    borderBottomWidth: 0,
  },
  dayLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.md,
  },
  dayValue: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
