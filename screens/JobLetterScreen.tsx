import React from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { generateEmploymentLetter, arrayBufferToBase64 } from '../api/letters';

const STORE_ADDRESSES = [
  '894 Upper James St, Hamilton, ON L9C 3A5',
  '1341 Upper James St, Hamilton, ON L9C 3B3',
  '917 Upper James St, Hamilton, ON L9C 3A3',
  '813 Upper James St, Hamilton, ON L9C 3A3',
  '1816 Rymal Rd E, Hamilton, ON L0R 1P0',
];

export default function JobLetterScreen({ onClose }: { onClose: () => void }) {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Job Letter</Text>
        <TouchableOpacity onPress={onClose} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Employee number</Text>
          <TextInput
            value={employeeNumber}
            onChangeText={setEmployeeNumber}
            placeholder="e.g. 46501"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            style={styles.input}
          />

          <Text style={[styles.label, { marginTop: 14 }]}>Select Store</Text>
          <View style={styles.segmentGroup}>
            {STORE_ADDRESSES.map((addr) => (
              <TouchableOpacity key={addr} onPress={() => setAddress(addr)} style={[styles.segmentItem, address === addr && styles.segmentItemActive]}>
                <Text style={[styles.segmentText, address === addr && styles.segmentTextActive]}>{addr}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 14 }]}>Employment Type</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity onPress={() => setEmploymentType('full')} style={[styles.toggleBtn, employmentType === 'full' && styles.toggleBtnActive]}>
              <Text style={[styles.toggleText, employmentType === 'full' && styles.toggleTextActive]}>Full-Time</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEmploymentType('part')} style={[styles.toggleBtn, employmentType === 'part' && styles.toggleBtnActive]}>
              <Text style={[styles.toggleText, employmentType === 'part' && styles.toggleTextActive]}>Part-Time</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onGenerate} style={[styles.button, !canSubmit && { opacity: 0.6 }]} disabled={!canSubmit}>
            {submitting ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text style={[styles.buttonText, { marginLeft: 8 }]}>Generating…</Text>
              </>
            ) : (
              <Text style={styles.buttonText}>Generate Letter</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  headerRow: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#0f172a', fontSize: 20, fontWeight: '700' },
  label: { color: '#0f172a', fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#334155', color: '#0f172a', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  button: { backgroundColor: '#0ea5e9', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: 'white', fontWeight: '700' },
  secondaryButton: { borderColor: '#334155', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  secondaryButtonText: { color: '#334155', fontSize: 12 },
  segmentGroup: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, overflow: 'hidden' },
  segmentItem: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  segmentItemActive: { backgroundColor: '#e0f2fe' },
  segmentText: { color: '#334155' },
  segmentTextActive: { color: '#0ea5e9', fontWeight: '700' },
  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  toggleBtn: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: 'white', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  toggleBtnActive: { borderColor: '#0ea5e9' },
  toggleText: { color: '#334155', fontWeight: '600' },
  toggleTextActive: { color: '#0ea5e9' },
});


