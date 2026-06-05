import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

type StoreCardProps = {
  children: React.ReactNode;
  variant?: 'standard' | 'hero';
};

export function StoreCard({ children, variant = 'standard' }: StoreCardProps) {
  return (
    <View style={[styles.card, variant === 'hero' && styles.hero]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  hero: {
    borderRadius: radius.xl,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
});
