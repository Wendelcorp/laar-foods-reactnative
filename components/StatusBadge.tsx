import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

export type BadgeType = 'success' | 'warning' | 'error' | 'neutral' | 'dark';

const badgeColors: Record<BadgeType, string> = {
  success: colors.statusSuccess,
  warning: colors.statusWarning,
  error: colors.statusError,
  neutral: colors.statusNeutral,
  dark: colors.primary,
};

type StatusBadgeProps = {
  type: BadgeType;
  children: React.ReactNode;
};

export function StatusBadge({ type, children }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: badgeColors[type] }]}>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
