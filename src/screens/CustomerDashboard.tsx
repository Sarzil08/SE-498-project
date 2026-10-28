import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import LiveMap from '../components/LiveMap';
import { AppHeader, BottomNavigation } from '../components';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { useLanguage, tr } from '../context/LanguageContext';
import { useAccidentEmergencyMonitor } from '../hooks/useAccidentEmergencyMonitor';

export default function CustomerDashboard({ route, navigation }: any) {
  const { language } = useLanguage();
  const notificationCount = useUnreadNotifications('customer');

  const [location, setLocation] = useState({
    latitude: 23.8103,
    longitude: 90.4125,
  });
  const [loadingLocation, setLoadingLocation] = useState(true);

  const name = route?.params?.name || 'বখতিয়ার';
  const email = route?.params?.email || 'customer@demo.com';
  const userId = route?.params?.userId || 'customer-demo';

  // Hardware/vehicle crash bridge can call emitAccidentSignal(). This listener
  // runs the 20-second no-movement safety window and SMS routing.
  useAccidentEmergencyMonitor({
    role: 'customer',
    userId,
    personName: name,
    vehicleInfo: 'Toyota Axio',
    vehicleId: userId,
  });

  useEffect(() => {
    let mounted = true;

    // Show the existing map immediately using the safe default location.
    setLoadingLocation(false);

    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        // Map should still render even when permission is denied.
        if (status !== 'granted') return;

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (mounted) {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        }
      } catch (error) {
        console.log('Customer location error:', error);
      } finally {
        if (mounted) setLoadingLocation(false);
      }
    };

    loadLocation();

    return () => {
      mounted = false;
    };
  }, []);

  const sendSOS = () => {
    navigation.navigate('OfflineAssistance', {
      role: 'customer',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#06111F" />

      {/* Home / Map header: Profile + Subscription + Notification + SOS */}
      <AppHeader
        name={name}
        email={email}
        role="customer"
        avatarText={name.charAt(0)}
        navigation={navigation}
        notificationCount={notificationCount}
        onProfile={() =>
          navigation.navigate('ProfileScreen', {
            role: 'customer',
            userId,
          })
        }
        onSubscription={() =>
          navigation.navigate('SubscriptionScreen', { role: 'customer', userId })
        }
        showSubscription
        showSOS
        onSOS={sendSOS}
      />

      {/* Home contains only the large map below the header. */}
      <View style={styles.mapArea}>
        {loadingLocation ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1687FF" />
            <Text style={styles.loadingText}>
              {tr(language, 'Loading map...', 'ম্যাপ লোড হচ্ছে...')}
            </Text>
          </View>
        ) : (
          <LiveMap
            userRole="customer"
            currentLocation={location}
            height={620}
            fullBleed
          />
        )}
      </View>

      <BottomNavigation
        activeTab="Home"
        role="customer"
        navigation={navigation}
        accentColor="#1687FF"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06111F',
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0F19',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 10,
  },
});
