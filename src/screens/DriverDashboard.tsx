import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Power, Truck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../supabaseClient';
import LiveMap from '../components/LiveMap';
import { AppHeader, BottomNavigation, StatCard, StatusBadge } from '../components';
import { addNotification } from '../components/notificationStore';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { useLanguage, tr } from '../context/LanguageContext';
import { useAccidentEmergencyMonitor } from '../hooks/useAccidentEmergencyMonitor';

const BACKGROUND_LOCATION_TASK = 'background-location-task';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
  if (error) { console.error('Background location error:', error); return; }
  if (!data?.locations?.length) return;
  const { latitude, longitude } = data.locations[0].coords;
  try {
    await supabase.from('vehicle_locations').upsert({ driver_id: 'v1', latitude, longitude, updated_at: new Date().toISOString() });
  } catch (err) { console.log('Supabase background push failed:', err); }
});

export default function DriverDashboard({ route, navigation }: any) {
  const { language } = useLanguage();
  const driverName = route?.params?.name || 'মো: কুদ্দুস মিয়া';
  const driverId = route?.params?.userId || 'v1';

  // Hardware/vehicle crash bridge can call emitAccidentSignal().
  useAccidentEmergencyMonitor({
    role: 'driver',
    userId: driverId,
    personName: driverName,
    vehicleInfo: 'Delivery Truck X-12',
    vehicleId: driverId,
  });
  const notificationCount = useUnreadNotifications('driver');
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({ latitude: 23.8103, longitude: 90.4125 });

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setCurrentLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        }
      } catch (error) { console.log('Initial driver location fetch failed:', error); }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const toggleTracking = async () => {
      try {
        if (isOnline) {
          const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
          const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
          if (fgStatus !== 'granted' || bgStatus !== 'granted') {
            if (!cancelled) {
              setIsOnline(false);
              Alert.alert(tr(language, 'Permission required', 'পারমিশন প্রয়োজন'), tr(language, 'Allow background location to enable live duty tracking.', 'লাইভ duty tracking চালু করতে background location অনুমতি দিন।'));
            }
            return;
          }
          const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
          if (!started) {
            await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 3000,
              distanceInterval: 1,
              foregroundService: {
                notificationTitle: 'Driver duty mode active',
                notificationBody: 'Live vehicle tracking is running.',
                notificationColor: '#FF8A00',
              },
            });
          }
          addNotification({ role: 'driver', title: 'Duty started', message: 'Your live vehicle location is now active.', kind: 'system' });
        } else {
          const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
          if (registered) await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        }
      } catch (error: any) {
        console.log('Tracking toggle failed:', error);
        if (!cancelled) setIsOnline(false);
      }
    };
    toggleTracking();
    return () => { cancelled = true; };
  }, [isOnline, language]);

  useEffect(() => NetInfo.addEventListener(state => {
    if (state.isConnected === false) {
      Alert.alert(tr(language, 'Offline', 'অফলাইন'), tr(language, 'Offline assistance is available.', 'অফলাইন assistance পাওয়া যাচ্ছে।'), [
        { text: tr(language, 'Open', 'খুলুন'), onPress: () => navigation.navigate('OfflineAssistance', { role: 'driver' }) },
        { text: tr(language, 'Close', 'বন্ধ') },
      ]);
    }
  }), [navigation, language]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader
        name={driverName}
        email="Delivery Truck X-12"
        role="driver"
        avatarText={driverName.charAt(0)}
        navigation={navigation}
        notificationCount={notificationCount}
        onProfile={() => navigation.navigate('ProfileScreen', { role: 'driver', userId: driverId })}
        showSOS
        onSOS={() => navigation.navigate('OfflineAssistance', { role: 'driver' })}
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Truck size={24} color="#FF8A00" /></View>
          <View style={{ flex: 1 }}><Text style={styles.title}>{tr(language, 'Driver Map', 'ড্রাইভার ম্যাপ')}</Text><Text style={styles.sub}>{tr(language, 'Live vehicle location and duty status.', 'লাইভ গাড়ির লোকেশন ও duty status।')}</Text></View>
          <StatusBadge text={isOnline ? tr(language, 'On Duty', 'ডিউটিতে') : tr(language, 'Off Duty', 'অফ ডিউটি')} type={isOnline ? 'success' : 'neutral'} />
        </View>

        <View style={styles.statRow}>
          <StatCard label={tr(language, 'Duty', 'ডিউটি')} value={isOnline ? 'ON' : 'OFF'} icon={<Power size={17} color="#FF8A00" />} accentColor="#FF8A00" compact />
          <StatCard label={tr(language, 'Vehicle', 'গাড়ি')} value="X-12" icon={<Truck size={17} color="#38BDF8" />} accentColor="#38BDF8" compact />
        </View>

        <View style={styles.card}>
          <View style={styles.row}><View style={[styles.iconBox, { backgroundColor: isOnline ? '#123B2A' : '#17263A' }]}><Power size={21} color={isOnline ? '#16C784' : '#94A3B8'} /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{tr(language, 'Live Duty Tracking', 'লাইভ ডিউটি ট্র্যাকিং')}</Text><Text style={styles.sub}>{isOnline ? tr(language, 'Your location is being shared.', 'আপনার লোকেশন শেয়ার হচ্ছে।') : tr(language, 'Turn on duty mode to share live location.', 'লাইভ লোকেশন শেয়ার করতে duty mode চালু করুন।')}</Text></View><Switch value={isOnline} onValueChange={setIsOnline} trackColor={{ false: '#334155', true: '#16C784' }} thumbColor="#F8FAFC" /></View>
        </View>

        <View style={styles.mapCard}><LiveMap currentLocation={currentLocation} userRole="driver" height={440} /></View>
        <View style={styles.infoCard}><Text style={styles.cardTitle}>{tr(language, 'Service work is under Service tab', 'সার্ভিসের কাজ Service tab-এ')}</Text><Text style={styles.sub}>{tr(language, 'Use the Service tab for mechanic search, vehicle health, payment and review.', 'Mechanic search, vehicle health, payment ও review-এর জন্য Service tab ব্যবহার করুন।')}</Text></View>
      </ScrollView>
      <BottomNavigation activeTab="Home" role="driver" navigation={navigation} accentColor="#FF8A00" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06111F' },
  scroll: { padding: 16, paddingBottom: 18 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#3B2A15', borderRadius: 16, padding: 13, marginBottom: 11 },
  heroIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#4B2500', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#F8FAFC', fontSize: 18, fontWeight: '900' },
  sub: { color: '#64748B', fontSize: 10, marginTop: 3, lineHeight: 15 },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 9 },
  card: { backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#1B2B40', borderRadius: 16, padding: 13, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '900' },
  mapCard: { height: 440, borderRadius: 18, overflow: 'hidden', backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#24364C', marginBottom: 10 },
  infoCard: { backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#1B2B40', borderRadius: 15, padding: 13 },
});
