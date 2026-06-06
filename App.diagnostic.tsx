import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function DiagnosticApp() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Diagnostic build OK</Text>
      <Text style={styles.subtitle}>If you see this, the JS bundle loaded.</Text>
      <Text style={styles.detail}>Build: {process.env.EXPO_PUBLIC_DIAGNOSTIC_MODE ?? 'unknown'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 16,
    textAlign: 'center',
  },
  detail: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 16,
  },
});
