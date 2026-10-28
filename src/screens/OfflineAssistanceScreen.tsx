import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Crown, MessageSquare, Phone, RefreshCw, WifiOff } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OfflineManager } from '../OfflineManager';
import { AppHeader, StatusBadge } from '../components';
import { AppRole, ROLE_MAP } from '../components/RoleBadge';

export default function OfflineAssistanceScreen({ navigation, route }: any) {
  const role: AppRole = route?.params?.role || 'customer';
  const [checking, setChecking] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineMechanics, setOfflineMechanics] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);

  const personName = route?.params?.name || (role === 'driver' ? 'Driver' : 'Customer');
  const vehicleInfo = route?.params?.vehicleInfo || (role === 'driver' ? 'Delivery Truck X-12' : 'Your registered vehicle');
  const centralNumber = '01712345678';

  useEffect(() => {
    OfflineManager.initDatabase();
    setOfflineMechanics(OfflineManager.getOfflineMechanics() as any[]);

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
      setChecking(false);
    });
    NetInfo.fetch().then(state => {
      setIsOnline(!!state.isConnected);
      setChecking(false);
    }).catch(() => setChecking(false));

    return unsubscribe;
  }, []);

  const syncMechanics = async () => {
    setSyncing(true);
    const res = await OfflineManager.downloadRouteData('offline');
    const cached = OfflineManager.getOfflineMechanics() as any[];
    setOfflineMechanics(cached);
    setSyncing(false);
    Alert.alert(
      res.success ? 'Updated' : 'Offline cache',
      res.success ? `${res.count || 0} mechanic contacts saved for offline SOS.` : 'Could not sync now. Existing local contacts are still available.',
    );
  };

  const sendSms = async (phone: string) => {
    const result = await OfflineManager.sendEmergencySMS(phone, personName, vehicleInfo);
    Alert.alert(
      result.success ? 'SMS ready' : 'SMS failed',
      result.success ? 'Emergency SMS was handed to the device SMS service with the latest GPS location.' : (result.message || result.error || 'Could not send the SMS.'),
    );
  };

  if (checking) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#38BDF8" /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader
        name="Emergency Assistance"
        email={`${ROLE_MAP[role].label} • SOS`}
        role={role}
        navigation={navigation}
        notificationCount={0}
        onBack={() => navigation.goBack()}
        showSOS={false}
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusBanner, !isOnline && styles.statusOffline]}>
          {isOnline ? <RefreshCw size={18} color="#16C784" /> : <WifiOff size={18} color="#F59E0B" />}
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>{isOnline ? 'Online + offline SOS ready' : 'Offline mode — SOS ready'}</Text>
            <Text style={styles.statusSub}>{isOnline ? 'Mechanic cache can be refreshed now. SMS fallback stays available.' : 'No internet is required for this screen, saved mechanics and device SMS fallback.'}</Text>
          </View>
          <StatusBadge text={isOnline ? 'ONLINE' : 'OFFLINE'} type={isOnline ? 'success' : 'warning'} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}><Crown size={18} color="#F59E0B" /><Text style={styles.cardTitle}>SOS emergency SMS</Text></View>
          <Text style={styles.cardSub}>This is the emergency screen opened from the Home SOS button. GPS works without internet; the phone's SMS service uses the cellular network.</Text>
          <TouchableOpacity style={styles.primary} onPress={() => sendSms(centralNumber)}><MessageSquare size={17} color="#FFF" /><Text style={styles.primaryText}>Send Central SOS SMS</Text></TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}><Phone size={18} color="#38BDF8" /><Text style={styles.cardTitle}>Saved nearby mechanics</Text></View>
          <Text style={styles.cardSub}>These contacts are stored locally so they remain available when the internet is off.</Text>
          {offlineMechanics.length ? offlineMechanics.slice(0, 8).map((mech: any) => (
            <View key={String(mech.id)} style={styles.mechanicRow}>
              <View style={{ flex: 1 }}><Text style={styles.mechanicName}>{mech.name || 'Mechanic'}</Text><Text style={styles.mechanicPhone}>{mech.phone}</Text></View>
              <TouchableOpacity style={styles.smsBtn} onPress={() => sendSms(String(mech.phone))}><MessageSquare size={15} color="#06111F" /><Text style={styles.smsText}>SMS</Text></TouchableOpacity>
            </View>
          )) : <Text style={styles.empty}>No cached mechanic contacts yet.</Text>}
          {isOnline && <TouchableOpacity style={styles.syncBtn} onPress={syncMechanics} disabled={syncing}>{syncing ? <ActivityIndicator color="#38BDF8" /> : <Text style={styles.syncText}>Refresh offline mechanic cache</Text>}</TouchableOpacity>}
        </View>

        <View style={styles.note}><Text style={styles.noteText}>Automatic server-side accident SMS still needs internet/Twilio. This offline SOS screen is designed for immediate manual emergency SMS when internet is unavailable.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06111F' },
  center: { flex: 1, backgroundColor: '#06111F', alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 24 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#0A2419', borderWidth: 1, borderColor: '#14532D', borderRadius: 15, padding: 12, marginBottom: 11 },
  statusOffline: { backgroundColor: '#2A2010', borderColor: '#6B4D10' },
  statusTitle: { color: '#F8FAFC', fontSize: 12, fontWeight: '900' },
  statusSub: { color: '#94A3B8', fontSize: 9, lineHeight: 13, marginTop: 3 },
  card: { backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#1B2B40', borderRadius: 15, padding: 13, marginBottom: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  cardTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '900' },
  cardSub: { color: '#94A3B8', fontSize: 10, lineHeight: 15 },
  primary: { height: 46, borderRadius: 11, backgroundColor: '#EF4444', marginTop: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  mechanicRow: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#06111F', borderWidth: 1, borderColor: '#18283B', borderRadius: 11, padding: 10, marginTop: 8 },
  mechanicName: { color: '#F8FAFC', fontSize: 11, fontWeight: '900' },
  mechanicPhone: { color: '#64748B', fontSize: 9, marginTop: 3 },
  smsBtn: { minWidth: 60, height: 34, borderRadius: 9, backgroundColor: '#38BDF8', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  smsText: { color: '#06111F', fontSize: 9, fontWeight: '900' },
  empty: { color: '#64748B', fontSize: 10, paddingVertical: 12 },
  syncBtn: { minHeight: 40, marginTop: 10, borderWidth: 1, borderColor: '#24364C', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  syncText: { color: '#38BDF8', fontSize: 10, fontWeight: '900' },
  note: { backgroundColor: '#111D2C', borderWidth: 1, borderColor: '#1F3550', borderRadius: 12, padding: 10 },
  noteText: { color: '#94A3B8', fontSize: 9, lineHeight: 14 },
});
