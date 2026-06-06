import { registerRootComponent } from 'expo';

const isDiagnostic = process.env.EXPO_PUBLIC_DIAGNOSTIC_MODE === 'true';

if (isDiagnostic) {
  registerRootComponent(require('./App.diagnostic').default);
} else {
  registerRootComponent(require('./App').default);
}
