import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

export function formatStoreTitle(storeId: string | number) {
  return `Store ${storeId}`;
}

type StoreCardHeaderProps = {
  storeId: string | number;
  trailing?: React.ReactNode;
};

export function StoreCardHeader({ storeId, trailing }: StoreCardHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{formatStoreTitle(storeId)}</Text>
      {trailing ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
