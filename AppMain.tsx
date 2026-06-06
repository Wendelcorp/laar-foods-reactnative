import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './theme';

enableScreens(true);

const HomeScreen = React.lazy(() => import('./screens/HomeScreen'));
const LabourScreen = React.lazy(() => import('./screens/LabourScreen'));
const OnShiftScreen = React.lazy(() => import('./screens/OnShiftScreen'));
const ZenputScreen = React.lazy(() => import('./screens/ZenputScreen'));
const MoreStack = React.lazy(() => import('./navigation/MoreStack'));

type TabParamList = {
  Home: undefined;
  Labour: undefined;
  OnShift: undefined;
  Logs: undefined;
  More: undefined;
};

const tabIcons = {
  Home: { active: 'home' as const, inactive: 'home-outline' as const },
  Labour: { active: 'people' as const, inactive: 'people-outline' as const },
  OnShift: { active: 'time' as const, inactive: 'time-outline' as const },
  Logs: { active: 'document-text' as const, inactive: 'document-text-outline' as const },
  More: { active: 'menu' as const, inactive: 'menu-outline' as const },
};

const TAB_BAR_CONTENT_HEIGHT = 56;
const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ name, focused }: { name: keyof typeof tabIcons; focused: boolean }) {
  const icon = tabIcons[name];
  return (
    <Ionicons
      name={focused ? icon.active : icon.inactive}
      size={22}
      color={focused ? colors.primary : colors.textTertiary}
    />
  );
}

function ScreenFallback() {
  return (
    <View style={styles.fallback}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

function MainTabs({
  apiKey,
  onChangeKey,
}: {
  apiKey: string | null;
  onChangeKey: () => void;
}) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        lazy: true,
        tabBarStyle: {
          ...styles.tabBar,
          height: TAB_BAR_CONTENT_HEIGHT + bottomInset + 10,
          paddingTop: 10,
          paddingBottom: bottomInset + 4,
        },
        tabBarItemStyle: styles.tabBarItem,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home" options={{ title: 'Home' }}>
        {() => (
          <React.Suspense fallback={<ScreenFallback />}>
            <HomeScreen apiKey={apiKey} />
          </React.Suspense>
        )}
      </Tab.Screen>
      <Tab.Screen name="Labour" options={{ title: 'Labour' }}>
        {() => (
          <React.Suspense fallback={<ScreenFallback />}>
            <LabourScreen />
          </React.Suspense>
        )}
      </Tab.Screen>
      <Tab.Screen name="OnShift" options={{ title: 'On Shift' }}>
        {() => (
          <React.Suspense fallback={<ScreenFallback />}>
            <OnShiftScreen />
          </React.Suspense>
        )}
      </Tab.Screen>
      <Tab.Screen name="Logs" options={{ title: 'Logs' }}>
        {() => (
          <React.Suspense fallback={<ScreenFallback />}>
            <ZenputScreen embedded />
          </React.Suspense>
        )}
      </Tab.Screen>
      <Tab.Screen name="More" options={{ title: 'More' }}>
        {() => (
          <React.Suspense fallback={<ScreenFallback />}>
            <MoreStack onChangeKey={onChangeKey} />
          </React.Suspense>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

type AppMainProps = {
  apiKey: string | null;
  onChangeKey: () => void;
};

class MainErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.errorTitle}>App error</Text>
          <Text style={styles.errorMessage}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function AppMain({ apiKey, onChangeKey }: AppMainProps) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <MainErrorBoundary>
          <NavigationContainer>
            <View style={styles.main}>
              <MainTabs apiKey={apiKey} onChangeKey={onChangeKey} />
            </View>
          </NavigationContainer>
        </MainErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  main: {
    flex: 1,
    backgroundColor: colors.bgDefault,
  },
  tabBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopColor: colors.borderDefault,
    borderTopWidth: 1,
    paddingHorizontal: 20,
  },
  tabBarItem: {
    paddingTop: 2,
    paddingBottom: 0,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgDefault,
    padding: 24,
  },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMessage: {
    color: colors.statusError,
    fontSize: 14,
    textAlign: 'center',
  },
});
