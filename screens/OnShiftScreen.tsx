import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchTodayShifts, TodayShiftsResponse, ShiftStore } from '../api/shifts';
import { AppHeader } from '../components/AppHeader';
import { StoreCard } from '../components/StoreCard';
import { StoreCardHeader } from '../components/StoreCardHeader';
import { colors, spacing } from '../theme';
import { sharedStyles } from '../styles/shared';

export default function OnShiftScreen({ onClose }: { onClose?: () => void }) {
  const [data, setData] = React.useState<TodayShiftsResponse | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async (opts?: { isRefresh?: boolean }) => {
    if (!opts?.isRefresh) setLoading(true);
    setError(null);
    try {
      const res = await fetchTodayShifts();
      const stores = Array.isArray(res?.stores) ? res.stores : [];
      const storesSorted = [...stores].sort((a, b) => {
        const aIs6 = a.store_number === '6';
        const bIs6 = b.store_number === '6';
        if (aIs6 && !bIs6) return -1;
        if (!aIs6 && bIs6) return 1;
        return Number(a.store_number) - Number(b.store_number);
      });
      setData({ ...res, stores: storesSorted });
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch shifts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    load({ isRefresh: true });
  }, [load]);

  const headerAction = onClose ? (
    <TouchableOpacity onPress={onClose} style={sharedStyles.secondaryButton}>
      <Text style={sharedStyles.secondaryButtonText}>Close</Text>
    </TouchableOpacity>
  ) : undefined;

  const renderStore = ({ item }: { item: ShiftStore }) => (
    <View style={styles.storeSection}>
      <StoreCard variant="hero">
        <StoreCardHeader
          storeId={item.store_number}
          trailing={
            <View style={sharedStyles.countPill}>
              <Text style={sharedStyles.countPillText}>{item.employee_count}</Text>
            </View>
          }
        />
        {item.employees.map((emp, idx) => (
          <View key={`${emp.name}-${idx}`} style={styles.employeeRow}>
            <Text style={styles.empName}>{emp.name}</Text>
            <Text style={[styles.empShift, emp.overnight && styles.overnight]}>
              {emp.shift_time}
            </Text>
          </View>
        ))}
      </StoreCard>
    </View>
  );

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top']}>
      <AppHeader title="On Shift" action={headerAction} />

      {loading && !data ? (
        <View style={sharedStyles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={sharedStyles.muted}>Loading…</Text>
        </View>
      ) : error ? (
        <View style={sharedStyles.centerBox}>
          <Text style={sharedStyles.error}>{error}</Text>
          <TouchableOpacity onPress={() => load()} style={sharedStyles.primaryButton}>
            <Text style={sharedStyles.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !data ? null : (
        <FlatList
          data={Array.isArray(data.stores) ? data.stores : []}
          keyExtractor={(s) => String(s?.store_number ?? Math.random())}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={sharedStyles.listContent}
          ListHeaderComponent={
            <View style={styles.summaryHeader}>
              {data?.date ? <Text style={styles.date}>{data.date}</Text> : null}
              {typeof data?.total_employees === 'number' ? (
                <View style={sharedStyles.summaryPill}>
                  <Text style={sharedStyles.summaryPillText}>Total: {data.total_employees}</Text>
                </View>
              ) : null}
            </View>
          }
          renderItem={renderStore}
          ListEmptyComponent={
            !loading && (!data.stores || data.stores.length === 0) ? (
              <View style={sharedStyles.centerBox}>
                <Text style={sharedStyles.muted}>No employees on shift</Text>
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
  date: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  storeSection: {
    marginBottom: spacing.xl,
  },
  employeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  empName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.md,
  },
  empShift: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  overnight: {
    color: colors.statusError,
  },
});
