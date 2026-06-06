import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gpsStoreNumber, triggerGpsBreakdownScrape } from '../api/gpsBreakdown';
import { useGpsBreakdown } from '../hooks/useGpsBreakdown';
import { AppHeader } from '../components/AppHeader';
import { StoreCard } from '../components/StoreCard';
import { StoreCardHeader } from '../components/StoreCardHeader';
import { colors, spacing } from '../theme';
import { sharedStyles } from '../styles/shared';

function formatScore(value: number | null) {
  if (value == null) return 'N/A';
  return value.toFixed(1);
}

export default function GpsScreen({ embedded = false }: { embedded?: boolean }) {
  const { data, loading, error, refresh } = useGpsBreakdown();
  const [rescraping, setRescraping] = React.useState(false);

  const onRescrape = React.useCallback(async () => {
    setRescraping(true);
    try {
      await triggerGpsBreakdownScrape();
      await refresh();
    } finally {
      setRescraping(false);
    }
  }, [refresh]);

  const headerActions = (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <TouchableOpacity onPress={refresh} style={sharedStyles.secondaryButton}>
        <Text style={sharedStyles.secondaryButtonText}>Refresh</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onRescrape} style={sharedStyles.secondaryButton} disabled={rescraping}>
        <Text style={sharedStyles.secondaryButtonText}>{rescraping ? 'Scraping…' : 'Rescrape'}</Text>
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
          <Text style={styles.range}>Through {data.end_date}</Text>
          <ScrollView contentContainerStyle={sharedStyles.listContent}>
            {[...data.stores]
              .sort((a, b) => {
                const aNum = gpsStoreNumber(a.store_number);
                const bNum = gpsStoreNumber(b.store_number);
                if (aNum === 6) return -1;
                if (bNum === 6) return 1;
                return aNum - bNum;
              })
              .map((store) => (
                <View key={store.store_id} style={styles.storeSection}>
                  <StoreCard variant="hero">
                    <StoreCardHeader storeId={gpsStoreNumber(store.store_number)} />
                    <View style={styles.tableHeader}>
                      <Text style={[styles.headerCell, styles.metricCol]}>Metric</Text>
                      <Text style={styles.headerCell}>7D</Text>
                      <Text style={styles.headerCell}>28D</Text>
                      <Text style={styles.headerCell}>YTD</Text>
                    </View>
                    {store.metrics.map((row) => (
                      <View key={row.metric} style={styles.row}>
                        <Text style={[styles.rowLabel, styles.metricCol]}>{row.metric}</Text>
                        <Text style={styles.rowValue}>{formatScore(row.last_7_days)}</Text>
                        <Text style={styles.rowValue}>{formatScore(row.last_28_days)}</Text>
                        <Text style={styles.rowValue}>{formatScore(row.ytd)}</Text>
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
        <AppHeader title="GPS" action={headerActions} />
        <Content />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={sharedStyles.screen}>
      <AppHeader title="GPS" action={headerActions} />
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
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  headerCell: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  metricCol: {
    flex: 1.6,
    textAlign: 'left',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  rowLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
