import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';

const MoreScreen = React.lazy(() => import('../screens/MoreScreen'));
const ContactsScreen = React.lazy(() => import('../screens/ContactsScreen'));
const JobLetterScreen = React.lazy(() => import('../screens/JobLetterScreen'));
const NightDeliveryScreen = React.lazy(() => import('../screens/NightDeliveryScreen'));
const LabourScreen = React.lazy(() => import('../screens/LabourScreen'));

export type MoreStackParamList = {
  MoreMenu: undefined;
  Contacts: undefined;
  JobLetter: undefined;
  NightDelivery: undefined;
  Labour: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

function ScreenFallback() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgDefault }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

type MoreStackProps = {
  onChangeKey: () => void;
};

export default function MoreStack({ onChangeKey }: MoreStackProps) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreMenu">
        {() => (
          <React.Suspense fallback={<ScreenFallback />}>
            <MoreScreen onChangeKey={onChangeKey} />
          </React.Suspense>
        )}
      </Stack.Screen>
      <Stack.Screen name="Contacts">
        {() => (
          <React.Suspense fallback={<ScreenFallback />}>
            <ContactsScreen />
          </React.Suspense>
        )}
      </Stack.Screen>
      <Stack.Screen name="JobLetter">
        {() => (
          <React.Suspense fallback={<ScreenFallback />}>
            <JobLetterScreen />
          </React.Suspense>
        )}
      </Stack.Screen>
      <Stack.Screen name="NightDelivery">
        {() => (
          <React.Suspense fallback={<ScreenFallback />}>
            <NightDeliveryScreen />
          </React.Suspense>
        )}
      </Stack.Screen>
      <Stack.Screen name="Labour">
        {() => (
          <React.Suspense fallback={<ScreenFallback />}>
            <LabourScreen />
          </React.Suspense>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
