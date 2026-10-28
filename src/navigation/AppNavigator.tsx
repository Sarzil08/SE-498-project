import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import AuthScreen from '../screens/AuthScreen';
import CustomerDashboard from '../screens/CustomerDashboard';
import SettingsScreen from '../screens/SettingsScreen';
import ServiceScreen from '../screens/ServiceScreen';
import ServiceHistoryScreen from '../screens/ServiceHistoryScreen';
import NotificationScreen from '../screens/NotificationScreen';
import StoreScreen from '../screens/StoreScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { LanguageProvider } from '../context/LanguageContext';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <LanguageProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="AuthScreen" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AuthScreen" component={AuthScreen} />
          <Stack.Screen name="CustomerDashboard" component={CustomerDashboard} />
          <Stack.Screen name="ServiceScreen" component={ServiceScreen} />
          <Stack.Screen name="ServiceHistory" component={ServiceHistoryScreen} />
          <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
          <Stack.Screen name="StoreScreen" component={StoreScreen} />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
          <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </LanguageProvider>
  );
}
