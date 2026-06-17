import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const SECURE_KEY = 'LIVE_GPS_API_KEY';
const GATE_ONLY = process.env.EXPO_PUBLIC_GATE_ONLY === 'true';

type MainAppComponent = React.ComponentType<{
  apiKey: string | null;
  onChangeKey: () => void;
}>;

export default function App() {
  const [apiKey, setApiKey] = React.useState<string | null>(null);
  const [editingKey, setEditingKey] = React.useState('');
  const [keyPromptDismissed, setKeyPromptDismissed] = React.useState(false);
  const [bootstrapping, setBootstrapping] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [MainApp, setMainApp] = React.useState<MainAppComponent | null>(null);
  const [enteringMain, setEnteringMain] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const SecureStore = await import('expo-secure-store');
        const existing = await SecureStore.getItemAsync(SECURE_KEY);
        if (!cancelled && existing) {
          setApiKey(existing);
          setKeyPromptDismissed(true);
        }
      } catch {
        // Ignore read failures; user can enter the key manually.
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMainApp = React.useCallback(() => {
    setEnteringMain(true);
    setLoadError(null);
    import('./AppMain')
      .then((mod) => setMainApp(() => mod.default))
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : 'Failed to load app');
        setEnteringMain(false);
        setKeyPromptDismissed(false);
        setApiKey(null);
      });
  }, []);

  React.useEffect(() => {
    if (GATE_ONLY || (!apiKey && !keyPromptDismissed)) {
      return;
    }
    loadMainApp();
  }, [apiKey, keyPromptDismissed, loadMainApp]);

  const saveKey = React.useCallback(async () => {
    if (!editingKey.trim()) return;
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(SECURE_KEY, editingKey.trim());
      setApiKey(editingKey.trim());
      setKeyPromptDismissed(true);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to save API key');
    }
  }, [editingKey]);

  const clearKey = React.useCallback(async () => {
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(SECURE_KEY);
    } catch {
      // Ignore delete failures when clearing local session.
    }
    setApiKey(null);
    setKeyPromptDismissed(false);
    setEditingKey('');
    setMainApp(null);
    setEnteringMain(false);
  }, []);

  const showGate =
    !bootstrapping && (GATE_ONLY || (!apiKey && !keyPromptDismissed && !enteringMain));

  if (bootstrapping) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color="#334155" />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.root}>
        <Text style={styles.errorTitle}>Startup error</Text>
        <Text style={styles.errorMessage}>{loadError}</Text>
        <TouchableOpacity onPress={() => setLoadError(null)} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showGate) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Enter API Key</Text>
        <TextInput
          value={editingKey}
          onChangeText={setEditingKey}
          placeholder="X-Api-Key"
          placeholderTextColor="#CBD5E1"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          style={styles.input}
        />
        <TouchableOpacity onPress={saveKey} style={styles.button}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
        {!GATE_ONLY ? (
          <TouchableOpacity
            onPress={() => {
              setKeyPromptDismissed(true);
              setEnteringMain(true);
            }}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Skip for now</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  if (MainApp) {
    return <MainApp apiKey={apiKey} onChangeKey={clearKey} />;
  }

  return (
    <View style={styles.root}>
      <ActivityIndicator color="#334155" />
      <Text style={styles.loadingText}>Loading app...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '700',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#334155',
    color: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  button: {
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButton: {
    borderColor: '#334155',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 12,
  },
  errorTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 12,
  },
});
