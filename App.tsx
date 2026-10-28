import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FakeShutdownProvider } from './src/components/FakeShutdownProvider';
import { LanguageProvider } from './src/context/LanguageContext';
import AuthScreen from './src/screens/AuthScreen';
import CustomerDashboard from './src/screens/CustomerDashboard';
import DriverDashboard from './src/screens/DriverDashboard';
import MechanicDashboard from './src/screens/MechanicDashboard';
import B2BDashboard from './src/screens/B2BDashboard';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import OfflineAssistanceScreen from './src/screens/OfflineAssistanceScreen';
import AdminRevenue from './src/screens/AdminRevenue';
import NotificationScreen from './src/screens/NotificationScreen';
import ServiceHistoryScreen from './src/screens/ServiceHistoryScreen';
import ServiceScreen from './src/screens/ServiceScreen';
import StoreScreen from './src/screens/StoreScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';

type AppRole = 'customer' | 'mechanic' | 'b2b' | 'driver';

export type RootStackParamList = {
  AuthScreen: undefined;
  CustomerDashboard: { email?: string; userId?: string; bypass?: boolean; focus?: 'home' | 'service' } | undefined;
  CustomerHome: { email?: string; userId?: string; bypass?: boolean; focus?: 'home' | 'service' } | undefined;
  DriverDashboard: { email?: string; userId?: string; bypass?: boolean; name?: string; focus?: 'home' | 'service' } | undefined;
  MechanicDashboard: { email?: string; userId?: string; bypass?: boolean; name?: string; focus?: 'home' | 'service' } | undefined;
  MechanicFeed: { email?: string; userId?: string; bypass?: boolean; name?: string; focus?: 'home' | 'service' } | undefined;
  B2BDashboard: { email?: string; userId?: string; bypass?: boolean; companyName?: string; focus?: 'home' | 'service' } | undefined;
  B2BDispatch: { email?: string; userId?: string; bypass?: boolean; companyName?: string; focus?: 'home' | 'service' } | undefined;
  OfflineAssistance: { role?: AppRole } | undefined;
  ProfileScreen: { role?: AppRole; userId?: string } | undefined;
  SettingsScreen: { role?: AppRole; userId?: string } | undefined;
  NotificationScreen: { role: AppRole };
  ServiceScreen: { role: AppRole; userId?: string };
  ServiceHistory: { role: AppRole; userId?: string };
  StoreScreen: { role: AppRole; userId?: string; sellerId?: string; sellerName?: string };
  ProductDetailsScreen: { productId: string; role: AppRole; userId?: string; quickAdd?: boolean };
  CartScreen: { role: AppRole; userId?: string };
  CheckoutScreen: { role: AppRole; userId?: string };
  SubscriptionScreen: { role?: 'customer' | 'driver'; userId?: string } | undefined;
  AdminRevenue: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <FakeShutdownProvider>
          <NavigationContainer>
            <StatusBar style="light" backgroundColor="#06111F" />
            <Stack.Navigator
              initialRouteName="AuthScreen"
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#06111F' },
              }}
            >
              <Stack.Screen name="AuthScreen" component={AuthScreen} />
              <Stack.Screen name="CustomerDashboard" component={CustomerDashboard} />
              <Stack.Screen name="CustomerHome" component={CustomerDashboard} />
              <Stack.Screen name="DriverDashboard" component={DriverDashboard} />
              <Stack.Screen name="MechanicDashboard" component={MechanicDashboard} />
              <Stack.Screen name="MechanicFeed" component={MechanicDashboard} />
              <Stack.Screen name="B2BDashboard" component={B2BDashboard} />
              <Stack.Screen name="B2BDispatch" component={B2BDashboard} />
              <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
              <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
              <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
              <Stack.Screen name="ServiceScreen" component={ServiceScreen} />
              <Stack.Screen name="ServiceHistory" component={ServiceHistoryScreen} />
              <Stack.Screen name="StoreScreen" component={StoreScreen} />
              <Stack.Screen name="ProductDetailsScreen" component={ProductDetailsScreen} />
              <Stack.Screen name="CartScreen" component={CartScreen} />
              <Stack.Screen name="CheckoutScreen" component={CheckoutScreen} />
              <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
              <Stack.Screen name="OfflineAssistance" component={OfflineAssistanceScreen} />
              <Stack.Screen name="AdminRevenue" component={AdminRevenue} />
            </Stack.Navigator>
          </NavigationContainer>
        </FakeShutdownProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
