import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { triggerZenputScrape, zenputStoreNumber } from '../api/zenput';
import { useZenputLogs } from '../hooks/useZenputLogs';
import { AppHeader } from '../components/AppHeader';
import { StoreCard } from '../components/StoreCard';
import { StoreCardHeader } from '../components/StoreCardHeader';
import { colors, spacing } from '../theme';
import { sharedStyles } from '../styles/shared';

function rateColor(rate: number | null) {
  if (rate == null) return colors.statusNeutral;
  return rate >= 90 ? colors.statusSuccess : colors.statusError;
}

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

  const headerActions = (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <TouchableOpacity onPress={refresh} style={sharedStyles.secondaryButton}>
        <Text style={sharedStyles.secondaryButtonText}>Refresh</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onRescrape} style={sharedStyles.secondaryButton} disabled={rescraping}>
        <Text style={sharedStyles.secondaryButtonText}>{rescraping ? 'Rescraping…' : 'Rescrape 30d'}</Text>
      </TouchableOpacity>
    </View>
  );

  const Content = () => (
    <>
      {loading ? (
        <View style={sharedStyles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={sharedStyles.muted}>Loading…</Text>
        </View>
      ) : error ? (
        <View style={sharedStyles.centerBox}>
          <Text style={sharedStyles.error}>{error}</Text>
        </View>
      ) : !data ? null : (
        <>
          <Text style={styles.range}>
            {data.date_start} → {data.date_end}
          </Text>
          <ScrollView contentContainerStyle={sharedStyles.listContent}>
            {[...data.stores]
              .sort((a, b) => {
                const aNum = zenputStoreNumber(a.store_name);
                const bNum = zenputStoreNumber(b.store_name);
                if (aNum === 6) return -1;
                if (bNum === 6) return 1;
                return aNum - bNum;
              })
              .map((s) => (
              <View key={s.store_id} style={styles.storeSection}>
                <StoreCard variant="hero">
                  <StoreCardHeader storeId={zenputStoreNumber(s.store_name)} />
                  {Object.entries(s.labels).map(([label, rate]) => (
                    <View key={label} style={styles.row}>
                      <Text style={styles.rowLabel}>{label}</Text>
                      <Text style={[styles.rowValue, { color: rateColor(rate) }]}>
                        {rate == null ? 'N/A' : `${rate}%`}
                      </Text>
                    </View>
                  ))}
                </StoreCard>
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </>
  );

  if (embedded) {
    return (
      <SafeAreaView style={sharedStyles.screen} edges={['top']}>
        <AppHeader title="Logs" action={headerActions} />
        <Content />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={sharedStyles.screen}>
      <AppHeader title="Logs" action={headerActions} />
      <Content />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  range: {
    color: colors.textSecondary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
    fontSize: 14,
    fontWeight: '600',
  },
  storeSection: {
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  rowLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.md,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '800',
  },
});
