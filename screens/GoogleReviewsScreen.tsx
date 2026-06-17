import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  fetchGoogleReviews,
  type GoogleReview,
  type GoogleReviewStore,
  type GoogleReviewsResponse,
} from '../api/googleReviews';

export default function GoogleReviewsScreen({ onClose }: { onClose: () => void }) {
  const [data, setData] = React.useState<GoogleReviewsResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAll = React.useCallback(async (opts?: { isRefresh?: boolean }) => {
    if (!opts?.isRefresh) setLoading(true);
    setError(null);
    try {
      setData(await fetchGoogleReviews());
    } catch (e: any) {
      setError(e?.message || 'Failed to load Google reviews');
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

  const renderStore = ({ item }: { item: GoogleReviewStore }) => (
    <View style={styles.storeSection}>
      <View style={styles.storeHeaderRow}>
        <Text style={styles.storeTitle}>Store {item.store_number}</Text>
        <View style={styles.ratingPill}>
          <Text style={styles.ratingPillText}>
            Avg {formatRating(item.average_rating)}
          </Text>
        </View>
      </View>
      <Text style={styles.storeMeta}>
        Showing {item.reviews.length} five-star reviews from the latest {item.scanned_review_count ?? data?.review_scan_limit ?? 25}
      </Text>

      {item.reviews.length > 0 ? (
        item.reviews.map((review) => (
          <ReviewCard key={review.review_id || `${review.author}-${review.date}`} review={review} />
        ))
      ) : (
        <View style={styles.emptyStoreCard}>
          <Text style={styles.muted}>No five-star reviews found in the latest reviews for this store.</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Google Reviews</Text>
        <TouchableOpacity onPress={onClose} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Close</Text>
        </TouchableOpacity>
      </View>

      {loading && !data ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.muted}>Loading reviews...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={() => fetchAll()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data?.stores ?? []}
          keyExtractor={(item) => item.store_number}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          renderItem={renderStore}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.centerBox}>
                <Text style={styles.muted}>No Google reviews available</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function ReviewCard({ review }: { review: GoogleReview }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.author}>{review.author}</Text>
          <Text style={styles.date}>{formatDate(review.date)}</Text>
        </View>
        <Text style={styles.stars}>{`${Math.max(0, Math.min(5, review.rating))}/5`}</Text>
      </View>
      <Text style={styles.reviewText}>{review.text || 'Rating-only review'}</Text>
    </View>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRating(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return Number(value).toFixed(1);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  headerRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: '#0f172a', fontSize: 20, fontWeight: '700' },
  centerBox: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  muted: { color: '#6b7280', marginTop: 8 },
  error: { color: '#ef4444', fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  listContent: { paddingHorizontal: 12, paddingBottom: 24 },
  secondaryButton: {
    borderColor: '#334155',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  secondaryButtonText: { color: '#334155', fontSize: 12 },
  primaryButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryButtonText: { color: 'white', fontWeight: '700' },
  storeSection: { marginBottom: 18 },
  storeHeaderRow: {
    paddingHorizontal: 4,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storeTitle: { color: '#0f172a', fontSize: 22, fontWeight: '800' },
  storeMeta: { color: '#6b7280', fontSize: 12, fontWeight: '600', marginBottom: 8, paddingHorizontal: 4 },
  ratingPill: { backgroundColor: '#f1f5f9', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  ratingPillText: { color: '#334155', fontSize: 12, fontWeight: '700' },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  emptyStoreCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  reviewHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  author: { color: '#0f172a', fontSize: 15, fontWeight: '700' },
  date: { color: '#6b7280', fontSize: 12, fontWeight: '600', marginTop: 2 },
  stars: { color: '#f59e0b', fontSize: 14, fontWeight: '800' },
  reviewText: { color: '#334155', fontSize: 14, lineHeight: 20, marginTop: 10 },
});
