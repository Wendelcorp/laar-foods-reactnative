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
  fetchGoogleReviews,
  type GoogleReview,
  type GoogleReviewStore,
  type GoogleReviewsResponse,
} from '../api/googleReviews';
import { AppHeader } from '../components/AppHeader';
import { StoreCard } from '../components/StoreCard';
import { StoreCardHeader } from '../components/StoreCardHeader';
import { sharedStyles } from '../styles/shared';
import { colors, spacing } from '../theme';

const TRACKED_STORE_IDS = [6, 941, 1674, 5767, 7456] as const;

function sortStores(stores: GoogleReviewStore[]) {
  const byNumber = new Map(stores.map((store) => [Number(store.store_number), store]));
  return TRACKED_STORE_IDS.map((storeId) => byNumber.get(storeId)).filter(
    (store): store is GoogleReviewStore => store != null,
  );
}

export default function GoogleReviewsScreen() {
  const navigation = useNavigation();
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

  const storeSections = React.useMemo(
    () => sortStores(data?.stores ?? []),
    [data?.stores],
  );

  const headerAction = (
    <TouchableOpacity onPress={() => navigation.goBack()} style={sharedStyles.secondaryButton}>
      <Text style={sharedStyles.secondaryButtonText}>Back</Text>
    </TouchableOpacity>
  );

  const renderStore = ({ item }: { item: GoogleReviewStore }) => (
    <View style={styles.storeSection}>
      <StoreCard variant="hero">
        <StoreCardHeader
          storeId={item.store_number}
          trailing={
            <View style={sharedStyles.summaryPill}>
              <Text style={sharedStyles.summaryPillText}>
                Avg {formatRating(item.average_rating)}
              </Text>
            </View>
          }
        />
        <Text style={styles.storeMeta}>
          {item.reviews.length} five-star reviews from the latest{' '}
          {item.scanned_review_count ?? data?.review_scan_limit ?? 5} Google reviews
        </Text>

        {item.reviews.length > 0 ? (
          item.reviews.map((review) => (
            <ReviewRow
              key={review.review_id || `${review.author}-${review.date}`}
              review={review}
              isLast={review === item.reviews[item.reviews.length - 1]}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No five-star reviews in the latest Google reviews.</Text>
        )}
      </StoreCard>
    </View>
  );

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top']}>
      <AppHeader title="Google Reviews" action={headerAction} />

      {loading && !data ? (
        <View style={sharedStyles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={sharedStyles.muted}>Loading reviews...</Text>
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
          keyExtractor={(item) => item.store_number}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={sharedStyles.listContent}
          renderItem={renderStore}
          ListEmptyComponent={
            !loading ? (
              <View style={sharedStyles.centerBox}>
                <Text style={sharedStyles.muted}>No Google reviews available</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function ReviewRow({ review, isLast }: { review: GoogleReview; isLast: boolean }) {
  return (
    <View style={[styles.reviewRow, isLast && styles.reviewRowLast]}>
      <View style={styles.reviewHeader}>
        <Text style={styles.author}>{review.author}</Text>
        <Text style={styles.rating}>{review.rating}/5</Text>
      </View>
      <Text style={styles.date}>{formatDate(review.date)}</Text>
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
  storeSection: {
    marginBottom: spacing.xl,
  },
  storeMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  reviewRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  reviewRowLast: {
    borderBottomWidth: 0,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  author: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  rating: {
    color: colors.statusWarning,
    fontSize: 13,
    fontWeight: '700',
  },
  date: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  reviewText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: '600',
  },
});
