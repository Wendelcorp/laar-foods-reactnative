import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MoreScreen from '../screens/MoreScreen';
import ContactsScreen from '../screens/ContactsScreen';
import JobLetterScreen from '../screens/JobLetterScreen';
import NightDeliveryScreen from '../screens/NightDeliveryScreen';

export type MoreStackParamList = {
  MoreMenu: undefined;
  Contacts: undefined;
  JobLetter: undefined;
  NightDelivery: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

type MoreStackProps = {
  onChangeKey: () => void;
};

export default function MoreStack({ onChangeKey }: MoreStackProps) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreMenu">
        {() => <MoreScreen onChangeKey={onChangeKey} />}
      </Stack.Screen>
      <Stack.Screen name="Contacts" component={ContactsScreen} />
      <Stack.Screen name="JobLetter" component={JobLetterScreen} />
      <Stack.Screen name="NightDelivery" component={NightDeliveryScreen} />
    </Stack.Navigator>
  );
}
