import React from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { triggerZenputScrape } from '../api/zenput';
import { useZenputLogs } from '../hooks/useZenputLogs';

export default function ZenputScreen({ embedded = false }: { embedded?: boolean }) {
  const { data, loading, error, refresh } = useZenputLogs();
  const [rescraping, setRescraping] = React.useState(false);

  const onRescrape = React.useCallback(async () => {
    if (!data) return;
    setRescraping(true);
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);
      await triggerZenputScrape(toIsoDate(start), toIsoDate(end));
      await refresh();
    } finally {
      setRescraping(false);
    }
  }, [data, refresh]);

  const Content = () => (
    <>
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : !data ? null : (
        <>
          <Text style={styles.range}>{data.date_start} → {data.date_end}</Text>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 32 }}>
            {data.stores.map((s) => (
              <View key={s.store_id} style={styles.card}>
                <Text style={styles.cardTitle}>Store: {s.store_name}</Text>
                {Object.entries(s.labels).map(([label, rate]) => (
                  <View key={label} style={styles.row}>
                    <Text style={styles.label}>{label}</Text>
                    <Text style={[styles.value, { color: rate == null ? '#6b7280' : rate >= 90 ? '#22c55e' : '#ef4444' }]}>
                      {rate == null ? 'N/A' : `${rate}%`}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </>
  );

  if (embedded) {
    return (
      <View style={styles.container}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
          <TouchableOpacity onPress={refresh} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRescrape} style={styles.secondaryButton} disabled={rescraping}>
            <Text style={styles.secondaryButtonText}>{rescraping ? 'Rescraping…' : 'Rescrape 30d'}</Text>
          </TouchableOpacity>
        </View>
        <Content />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Zenput Logs</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={refresh} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRescrape} style={styles.secondaryButton} disabled={rescraping}>
            <Text style={styles.secondaryButtonText}>{rescraping ? 'Rescraping…' : 'Rescrape 30d'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Content />
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
  range: { color: '#6b7280', paddingHorizontal: 16, marginBottom: 8 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 12, marginVertical: 6, borderColor: '#e5e7eb', borderWidth: 1 },
  cardTitle: { color: '#0f172a', fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  label: { color: '#0f172a' },
  value: { fontWeight: '700' },
});


