import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchTodayShifts, TodayShiftsResponse, ShiftStore } from '../api/shifts';

export default function OnShiftScreen({ onClose }: { onClose: () => void }) {
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
      // Sort stores: store 6 on top, then numeric asc
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

  const renderStore = ({ item }: { item: ShiftStore }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Store {item.store_number}</Text>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{item.employee_count}</Text>
        </View>
      </View>
      {item.employees.map((emp, idx) => (
        <View key={`${emp.name}-${idx}`} style={styles.row}>
          <Text style={styles.empName}>{emp.name}</Text>
          <Text style={[styles.empShift, emp.overnight && { color: '#ef4444' }]}>{emp.shift_time}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>On Shift</Text>
        <TouchableOpacity onPress={onClose} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Close</Text>
        </TouchableOpacity>
      </View>

      {loading && !data ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={() => load()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !data ? null : (
        <FlatList
          data={Array.isArray(data.stores) ? data.stores : []}
          keyExtractor={(s) => String(s?.store_number ?? Math.random())}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 4, marginBottom: 8, alignItems: 'center' }}>
              {data?.date ? <Text style={styles.date}>{data.date}</Text> : null}
              {typeof data?.total_employees === 'number' ? (
                <View style={styles.totalPill}>
                  <Text style={styles.totalText}>Total: {data.total_employees}</Text>
                </View>
              ) : null}
            </View>
          }
          renderItem={renderStore}
          ListEmptyComponent={(!loading && (!data.stores || data.stores.length === 0)) ? (
            <View style={styles.centerBox}>
              <Text style={styles.muted}>No employees on shift</Text>
            </View>
          ) : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  headerRow: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#0f172a', fontSize: 20, fontWeight: '700' },
  secondaryButton: { borderColor: '#334155', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  secondaryButtonText: { color: '#334155', fontSize: 12 },
  centerBox: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  muted: { color: '#6b7280', marginTop: 8 },
  error: { color: '#ef4444', fontWeight: '700' },
  date: { color: '#6b7280' },
  totalPill: { marginTop: 6, backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  totalText: { color: '#0f172a', fontWeight: '700' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 12, marginVertical: 6, borderColor: '#e5e7eb', borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
  countPill: { backgroundColor: '#0ea5e9', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { color: 'white', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  empName: { color: '#0f172a' },
  empShift: { color: '#334155', fontWeight: '600' },
  primaryButton: { backgroundColor: '#0ea5e9', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, marginTop: 12 },
  primaryButtonText: { color: 'white', fontWeight: '700' },
});


