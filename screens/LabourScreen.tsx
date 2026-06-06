import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { AppHeader } from '../components/AppHeader';
import { StatusBadge } from '../components/StatusBadge';
import { StoreCard } from '../components/StoreCard';
import { StoreCardHeader } from '../components/StoreCardHeader';
import { colors, radius, spacing } from '../theme';
import { sharedStyles } from '../styles/shared';

type LabourStore = {
  store_number: number;
  net_sales: number;
  hours: number;
  average: number;
  target_difference: number;
  under_target: boolean;
  days_with_data: number;
};

type LabourConsolidated = {
  net_sales: string;
  hours: string;
  average: string;
  target_difference: string;
  under_target: boolean;
};

type LabourStoreSummary = {
  total_stores: number;
  stores_under_target: number;
  stores_over_target: number;
  best_store: { store_number: number; average: number };
  worst_store: { store_number: number; average: number };
};

type LabourData = {
  month_display: string;
  consolidated: LabourConsolidated;
  stores: Record<string, LabourStore>;
  store_summary: LabourStoreSummary;
};

type LabourResponse = {
  success: boolean;
  data: LabourData;
};

const SECURE_KEY = 'LIVE_GPS_API_KEY';

interface LabourScreenProps {
  onClose?: () => void;
}

function formatCurrency(value: string | number) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}

function formatNumber(value: number) {
  if (isNaN(value)) return '-';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatHours(value: string | number) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
}

function semanticColor(good: boolean) {
  return good ? colors.statusSuccess : colors.statusError;
}

export default function LabourScreen({ onClose }: LabourScreenProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labourData, setLabourData] = useState<LabourData | null>(null);

  const fetchLabourData = async (isRefresh = false) => {
    try {
      const apiKey = await SecureStore.getItemAsync(SECURE_KEY);
      if (!apiKey) {
        setError('No API key found');
        return;
      }
      if (!isRefresh) setLoading(true);
      setError(null);

      const response = await axios.get<LabourResponse>(
        'https://laar-foods-app-f5dacb5702ee.herokuapp.com/api/monthly_labours/latest',
        { headers: { 'X-Api-Key': apiKey }, timeout: 15000 },
      );

      if (response.data.success) {
        setLabourData(response.data.data);
      } else {
        setError('Failed to fetch labour data');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to fetch labour data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabourData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLabourData(true).finally(() => setRefreshing(false));
  };

  const headerAction = onClose ? (
    <TouchableOpacity onPress={onClose} style={sharedStyles.secondaryButton}>
      <Text style={sharedStyles.secondaryButtonText}>Close</Text>
    </TouchableOpacity>
  ) : undefined;

  const renderStoreItem = ({ item }: { item: LabourStore }) => (
    <View style={styles.storeSection}>
      <StoreCard variant="hero">
        <StoreCardHeader
          storeId={item.store_number}
          trailing={
            <StatusBadge type={item.under_target ? 'success' : 'error'}>
              {item.under_target ? 'Under' : 'Over'}
            </StatusBadge>
          }
        />
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={sharedStyles.metricLabel}>Net Sales</Text>
            <Text style={styles.gridValue}>{formatCurrency(item.net_sales)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={sharedStyles.metricLabel}>Hours</Text>
            <Text style={styles.gridValue}>{formatHours(item.hours)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={sharedStyles.metricLabel}>Average</Text>
            <Text style={[styles.gridValue, { color: semanticColor(item.under_target) }]}>
              {formatNumber(item.average)}
            </Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={sharedStyles.metricLabel}>Target Diff</Text>
            <Text style={[styles.gridValue, { color: semanticColor(item.target_difference <= 0) }]}>
              {item.target_difference >= 0 ? '+' : ''}
              {formatNumber(item.target_difference)}
            </Text>
          </View>
        </View>
        <Text style={styles.daysText}>{item.days_with_data} days with data</Text>
      </StoreCard>
    </View>
  );

  const renderBody = () => {
    if (loading) {
      return (
        <View style={sharedStyles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={sharedStyles.muted}>Loading labour data…</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={sharedStyles.centerBox}>
          <Text style={sharedStyles.error}>{error}</Text>
          <TouchableOpacity onPress={() => fetchLabourData()} style={sharedStyles.primaryButton}>
            <Text style={sharedStyles.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (!labourData) {
      return (
        <View style={sharedStyles.centerBox}>
          <Text style={sharedStyles.muted}>No labour data available</Text>
        </View>
      );
    }

    const storesArray = Object.values(labourData.stores).sort((a, b) => {
      if (a.store_number === 6) return -1;
      if (b.store_number === 6) return 1;
      return a.store_number - b.store_number;
    });

    return (
      <FlatList
        data={storesArray}
        keyExtractor={(item) => item.store_number.toString()}
        renderItem={renderStoreItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={sharedStyles.listContent}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text style={styles.monthTitle}>{labourData.month_display}</Text>

            <StoreCard variant="hero">
              <Text style={styles.cardHeading}>Consolidated</Text>
              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <Text style={sharedStyles.metricLabel}>Net Sales</Text>
                  <Text style={styles.gridValue}>{formatCurrency(labourData.consolidated.net_sales)}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={sharedStyles.metricLabel}>Total Hours</Text>
                  <Text style={styles.gridValue}>{formatHours(labourData.consolidated.hours)}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={sharedStyles.metricLabel}>Average</Text>
                  <Text style={[styles.gridValue, { color: semanticColor(labourData.consolidated.under_target) }]}>
                    {formatNumber(parseFloat(labourData.consolidated.average))}
                  </Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={sharedStyles.metricLabel}>Target Diff</Text>
                  <Text
                    style={[
                      styles.gridValue,
                      { color: semanticColor(parseFloat(labourData.consolidated.target_difference) <= 0) },
                    ]}
                  >
                    {parseFloat(labourData.consolidated.target_difference) >= 0 ? '+' : ''}
                    {formatNumber(parseFloat(labourData.consolidated.target_difference))}
                  </Text>
                </View>
              </View>
            </StoreCard>

            <StoreCard>
              <Text style={styles.cardHeading}>Store Summary</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={sharedStyles.metricLabel}>Total Stores</Text>
                  <Text style={styles.summaryValue}>{labourData.store_summary.total_stores}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={sharedStyles.metricLabel}>Under Target</Text>
                  <Text style={[styles.summaryValue, { color: colors.statusSuccess }]}>
                    {labourData.store_summary.stores_under_target}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={sharedStyles.metricLabel}>Over Target</Text>
                  <Text style={[styles.summaryValue, { color: colors.statusError }]}>
                    {labourData.store_summary.stores_over_target}
                  </Text>
                </View>
              </View>
              <View style={styles.bestWorstRow}>
                <View style={styles.bestWorstItem}>
                  <Text style={sharedStyles.metricLabel}>Best Store</Text>
                  <Text style={styles.bestWorstValue}>
                    #{labourData.store_summary.best_store.store_number} ({formatNumber(labourData.store_summary.best_store.average)})
                  </Text>
                </View>
                <View style={styles.bestWorstItem}>
                  <Text style={sharedStyles.metricLabel}>Worst Store</Text>
                  <Text style={styles.bestWorstValue}>
                    #{labourData.store_summary.worst_store.store_number} ({formatNumber(labourData.store_summary.worst_store.average)})
                  </Text>
                </View>
              </View>
            </StoreCard>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top']}>
      <AppHeader title="Labour Report" action={headerAction} />
      {renderBody()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    gap: spacing.xl,
    marginBottom: spacing.xl,
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  gridItem: {
    width: '47%',
    alignItems: 'center',
  },
  gridValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bestWorstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  bestWorstItem: {
    flex: 1,
    alignItems: 'center',
  },
  bestWorstValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  storeSection: {
    marginBottom: spacing.xl,
  },
  daysText: {
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
