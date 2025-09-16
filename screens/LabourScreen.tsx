import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

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
  best_store: {
    store_number: number;
    average: number;
  };
  worst_store: {
    store_number: number;
    average: number;
  };
};

type LabourData = {
  id: number;
  month: string;
  month_display: string;
  consolidated: LabourConsolidated;
  stores: Record<string, LabourStore>;
  store_summary: LabourStoreSummary;
  created_at: string;
  updated_at: string;
};

type LabourResponse = {
  success: boolean;
  data: LabourData;
};

const SECURE_KEY = 'LIVE_GPS_API_KEY';

interface LabourScreenProps {
  onClose: () => void;
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
        {
          headers: { 'X-Api-Key': apiKey },
          timeout: 15000,
        }
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

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatNumber = (value: number) => {
    if (isNaN(value)) return '-';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatHours = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const renderStoreItem = ({ item }: { item: LabourStore }) => (
    <View style={styles.storeCard}>
      <View style={styles.storeHeader}>
        <Text style={styles.storeNumber}>Store {item.store_number}</Text>
        <View style={[
          styles.targetIndicator,
          { backgroundColor: item.under_target ? '#22c55e' : '#ef4444' }
        ]}>
          <Text style={styles.targetIndicatorText}>
            {item.under_target ? 'Under' : 'Over'}
          </Text>
        </View>
      </View>
      
      <View style={styles.storeMetrics}>
        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Net Sales</Text>
            <Text style={styles.metricValue}>{formatCurrency(item.net_sales)}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Hours</Text>
            <Text style={styles.metricValue}>{formatHours(item.hours)}</Text>
          </View>
        </View>
        
        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Average</Text>
            <Text style={[
              styles.metricValue,
              { color: item.under_target ? '#22c55e' : '#ef4444' }
            ]}>
              {formatNumber(item.average)}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Target Diff</Text>
            <Text style={[
              styles.metricValue,
              { color: item.target_difference <= 0 ? '#22c55e' : '#ef4444' }
            ]}>
              {item.target_difference >= 0 ? '+' : ''}{formatNumber(item.target_difference)}
            </Text>
          </View>
        </View>
        
        <View style={styles.daysInfo}>
          <Text style={styles.daysText}>{item.days_with_data} days with data</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Labour Report</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.muted}>Loading labour data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Labour Report</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchLabourData()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!labourData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Labour Report</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centerBox}>
          <Text style={styles.muted}>No labour data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const storesArray = Object.values(labourData.stores).sort((a, b) => a.store_number - b.store_number);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Labour Report</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={storesArray}
        keyExtractor={(item) => item.store_number.toString()}
        renderItem={renderStoreItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text style={styles.monthTitle}>{labourData.month_display}</Text>
            
            <View style={styles.consolidatedCard}>
              <Text style={styles.consolidatedTitle}>Consolidated</Text>
              <View style={styles.consolidatedMetrics}>
                <View style={styles.consolidatedMetric}>
                  <Text style={styles.consolidatedLabel}>Net Sales</Text>
                  <Text style={styles.consolidatedValue}>
                    {formatCurrency(labourData.consolidated.net_sales)}
                  </Text>
                </View>
                <View style={styles.consolidatedMetric}>
                  <Text style={styles.consolidatedLabel}>Total Hours</Text>
                  <Text style={styles.consolidatedValue}>
                    {formatHours(labourData.consolidated.hours)}
                  </Text>
                </View>
                <View style={styles.consolidatedMetric}>
                  <Text style={styles.consolidatedLabel}>Average</Text>
                  <Text style={[
                    styles.consolidatedValue,
                    { color: labourData.consolidated.under_target ? '#22c55e' : '#ef4444' }
                  ]}>
                    {formatNumber(parseFloat(labourData.consolidated.average))}
                  </Text>
                </View>
                <View style={styles.consolidatedMetric}>
                  <Text style={styles.consolidatedLabel}>Target Diff</Text>
                  <Text style={[
                    styles.consolidatedValue,
                    { color: parseFloat(labourData.consolidated.target_difference) <= 0 ? '#22c55e' : '#ef4444' }
                  ]}>
                    {parseFloat(labourData.consolidated.target_difference) >= 0 ? '+' : ''}
                    {formatNumber(parseFloat(labourData.consolidated.target_difference))}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Store Summary</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Stores</Text>
                  <Text style={styles.summaryValue}>{labourData.store_summary.total_stores}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Under Target</Text>
                  <Text style={[styles.summaryValue, { color: '#22c55e' }]}>
                    {labourData.store_summary.stores_under_target}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Over Target</Text>
                  <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                    {labourData.store_summary.stores_over_target}
                  </Text>
                </View>
              </View>
              <View style={styles.bestWorstRow}>
                <View style={styles.bestWorstItem}>
                  <Text style={styles.bestWorstLabel}>Best Store</Text>
                  <Text style={styles.bestWorstValue}>
                    #{labourData.store_summary.best_store.store_number} 
                    ({formatNumber(labourData.store_summary.best_store.average)})
                  </Text>
                </View>
                <View style={styles.bestWorstItem}>
                  <Text style={styles.bestWorstLabel}>Worst Store</Text>
                  <Text style={styles.bestWorstValue}>
                    #{labourData.store_summary.worst_store.store_number} 
                    ({formatNumber(labourData.store_summary.worst_store.average)})
                  </Text>
                </View>
              </View>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeButton: {
    borderColor: '#334155',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  muted: {
    color: '#6b7280',
    marginTop: 8,
  },
  errorText: {
    color: '#ef4444',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  headerSection: {
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 16,
  },
  consolidatedCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  consolidatedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  consolidatedMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  consolidatedMetric: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  consolidatedLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  consolidatedValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  bestWorstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bestWorstItem: {
    alignItems: 'center',
    flex: 1,
  },
  bestWorstLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  bestWorstValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
  },
  storeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  targetIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  targetIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  storeMetrics: {
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  daysInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  daysText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});
