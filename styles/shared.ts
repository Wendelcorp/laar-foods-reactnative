import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';

export const typography = {
  hero: { fontSize: 48, fontWeight: '800' as const },
  display: { fontSize: 28, fontWeight: '900' as const },
  title: { fontSize: 20, fontWeight: '700' as const },
  section: { fontSize: 18, fontWeight: '700' as const },
  valueLg: { fontSize: 22, fontWeight: '900' as const },
  valueMd: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  label: { fontSize: 10, fontWeight: '800' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
  caption: { fontSize: 12, fontWeight: '600' as const },
};

export const sharedStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgDefault,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  muted: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontSize: 14,
  },
  error: {
    color: colors.statusError,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  metricLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  metricValue: {
    ...typography.valueLg,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  secondaryButton: {
    borderColor: colors.primary,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  secondaryButtonSmall: {
    borderColor: colors.primary,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    marginTop: spacing.md,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.primary,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.sm,
    fontSize: 14,
  },
  fieldLabel: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 14,
  },
  link: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  countPill: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  countPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  summaryPill: {
    backgroundColor: colors.pillBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  summaryPillText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  activeSelection: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  activeSelectionText: {
    color: colors.primary,
    fontWeight: '700',
  },
});
