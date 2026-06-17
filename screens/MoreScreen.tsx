import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader';
import type { MoreStackParamList } from '../navigation/MoreStack';
import { colors, radius, spacing } from '../theme';

type MoreScreenProps = {
  onChangeKey: () => void;
};

const menuItems: Array<{
  id: string;
  label: string;
  action: 'contacts' | 'job-letter' | 'night-delivery' | 'labour' | 'google-reviews' | 'change-key' | 'coming-soon';
  disabled?: boolean;
}> = [
  { id: 'contacts', label: 'Contacts', action: 'contacts' },
  { id: 'labour', label: 'Labour', action: 'labour' },
  { id: 'job-letter', label: 'Job Letter', action: 'job-letter' },
  { id: 'night-delivery', label: 'Night Delivery', action: 'night-delivery' },
  { id: 'google-reviews', label: 'Google Reviews', action: 'google-reviews' },
  { id: 'change-api-key', label: 'Change API Key', action: 'change-key' },
  { id: 'inventory', label: 'Inventory', action: 'coming-soon', disabled: true },
  { id: 'calibration', label: 'Calibration', action: 'coming-soon', disabled: true },
  { id: 'filters', label: 'Filters', action: 'coming-soon', disabled: true },
];

export default function MoreScreen({ onChangeKey }: MoreScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList, 'MoreMenu'>>();

  const handlePress = (action: (typeof menuItems)[number]['action']) => {
    if (action === 'coming-soon') return;
    if (action === 'change-key') {
      onChangeKey();
      return;
    }
    if (action === 'contacts') {
      navigation.navigate('Contacts');
      return;
    }
    if (action === 'night-delivery') {
      navigation.navigate('NightDelivery');
      return;
    }
    if (action === 'labour') {
      navigation.navigate('Labour');
      return;
    }
    if (action === 'google-reviews') {
      navigation.navigate('GoogleReviews');
      return;
    }
    navigation.navigate('JobLetter');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="More" />
      <View style={styles.list}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.row, item.disabled && styles.rowDisabled]}
            disabled={item.disabled}
            onPress={() => handlePress(item.action)}
          >
            <Text style={[styles.label, item.disabled && styles.labelDisabled]}>
              {item.label}
              {item.disabled ? (
                <Text style={styles.comingSoon}> (Coming Soon)</Text>
              ) : null}
            </Text>
            {!item.disabled ? (
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDefault,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  labelDisabled: {
    color: colors.textTertiary,
  },
  comingSoon: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textTertiary,
  },
});
