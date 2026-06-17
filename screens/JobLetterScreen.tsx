import React from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { generateEmploymentLetter, arrayBufferToBase64 } from '../api/letters';
import { AppHeader } from '../components/AppHeader';
import { StoreCard } from '../components/StoreCard';
import { colors, radius, spacing } from '../theme';
import { sharedStyles } from '../styles/shared';

const STORE_ADDRESSES = [
  '894 Upper James St, Hamilton, ON L9C 3A5',
  '1341 Upper James St, Hamilton, ON L9C 3B3',
  '917 Upper James St, Hamilton, ON L9C 3A3',
  '813 Upper James St, Hamilton, ON L9C 3A3',
  '1816 Rymal Rd E, Hamilton, ON L0R 1P0',
];

export default function JobLetterScreen() {
  const navigation = useNavigation();
  const [employeeNumber, setEmployeeNumber] = React.useState('');
  const [address, setAddress] = React.useState<string>(STORE_ADDRESSES[0]);
  const [employmentType, setEmploymentType] = React.useState<'full' | 'part'>('full');
  const [submitting, setSubmitting] = React.useState(false);

  const canSubmit = employeeNumber.trim().length > 0 && address.trim().length > 0 && !submitting;

  const onGenerate = React.useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const pdfBuffer = await generateEmploymentLetter({
        employee_number: employeeNumber.trim(),
        workplace_address: address.trim(),
        full_time: employmentType === 'full',
      });

      const base64 = arrayBufferToBase64(pdfBuffer);
      const fileUri = `${FileSystem.cacheDirectory}job_letter_${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf', dialogTitle: 'Share Job Letter' });
      } else {
        Alert.alert('Saved', `PDF saved to: ${fileUri}`);
      }
    } catch (e: any) {
      Alert.alert('Generation failed', e?.message || 'Unable to generate letter');
    } finally {
      setSubmitting(false);
    }
  }, [employeeNumber, address, employmentType, canSubmit]);

  const headerAction = (
    <TouchableOpacity onPress={() => navigation.goBack()} style={sharedStyles.secondaryButton}>
      <Text style={sharedStyles.secondaryButtonText}>Back</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top']}>
      <AppHeader title="Job Letter" action={headerAction} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={sharedStyles.listContent} keyboardShouldPersistTaps="handled">
          <StoreCard>
            <Text style={sharedStyles.fieldLabel}>Employee number</Text>
            <TextInput
              value={employeeNumber}
              onChangeText={setEmployeeNumber}
              placeholder="e.g. 46501"
              placeholderTextColor={colors.textPlaceholder}
              keyboardType="number-pad"
              style={sharedStyles.input}
            />

            <Text style={[sharedStyles.fieldLabel, { marginTop: spacing.lg }]}>Select Store</Text>
            <View style={styles.segmentGroup}>
              {STORE_ADDRESSES.map((addr) => {
                const active = address === addr;
                return (
                  <TouchableOpacity
                    key={addr}
                    onPress={() => setAddress(addr)}
                    style={[styles.segmentItem, active && sharedStyles.activeSelection]}
                  >
                    <Text style={[styles.segmentText, active && sharedStyles.activeSelectionText]}>
                      {addr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[sharedStyles.fieldLabel, { marginTop: spacing.lg }]}>Employment Type</Text>
            <View style={styles.toggleRow}>
              {(['full', 'part'] as const).map((type) => {
                const active = employmentType === type;
                const label = type === 'full' ? 'Full-Time' : 'Part-Time';
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setEmploymentType(type)}
                    style={[styles.toggleBtn, active && sharedStyles.activeSelection]}
                  >
                    <Text style={[styles.toggleText, active && sharedStyles.activeSelectionText]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={onGenerate}
              style={[sharedStyles.primaryButton, !canSubmit && { opacity: 0.6 }]}
              disabled={!canSubmit}
            >
              {submitting ? (
                <View style={styles.submittingRow}>
                  <ActivityIndicator color="#fff" />
                  <Text style={[sharedStyles.primaryButtonText, { marginLeft: spacing.sm }]}>
                    Generating…
                  </Text>
                </View>
              ) : (
                <Text style={sharedStyles.primaryButtonText}>Generate Letter</Text>
              )}
            </TouchableOpacity>
          </StoreCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  segmentGroup: {
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  segmentItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  segmentText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  toggleText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
