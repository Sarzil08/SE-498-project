import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertTriangle, Building2, CheckCircle2, Layers, MapPin, Truck, User } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader, BottomNavigation, StatCard, StatusBadge } from '../components';
import { supabase } from '../supabaseClient';
import { AppRole, ROLE_MAP } from '../components/RoleBadge';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';

export default function B2BDashboard({ route, navigation }: any) {
  const role: AppRole = 'b2b';
  const notificationCount = useUnreadNotifications(role);
  const [subTab, setSubTab] = useState<'tracking' | 'drivers'>('tracking');
  const [selectedFleet, setSelectedFleet] = useState<any | null>(null);

  const [activeFleets, setActiveFleets] = useState([
    {
      id: 'v1', name: 'Delivery Truck X-12', vehicleNumber: 'ঢাকা মেট্রো-ট ১১-২২৩৩', status: 'On Route', lat: 23.8103, lng: 90.4125, alert: false,
      driverName: 'মো: কুদ্দুস মিয়া', driverPhone: '+8801711223344', driverNID: '19952612345678901',
      health: { engineHealth: '92%', batteryStatus: 'Good', brakeStatus: 'Normal', fuelLevel: '78%', temperature: '85°C' },
      serviceHistory: [{ date: '২০২৬-০৯-১০', issue: 'ইঞ্জিন অয়েল চেঞ্জ', cost: '৳৪,৫০০', mechanic: 'রহিম মটরস' }],
      locationHistory: ['গাবতলী টার্মিনাল', 'সাভার বাস স্ট্যান্ড', 'চন্দ্রা মোড়', 'টাঙ্গাইল বাইপাস'],
    },
    {
      id: 'v2', name: 'Cargo Van Y-04', vehicleNumber: 'ঢাকা মেট্রো-চ ৪৪-৫৫৬৬', status: 'Needs Maintenance', lat: 23.8165, lng: 90.4210, alert: true,
      driverName: 'আলমগীর হোসেন', driverPhone: '+8801911998877', driverNID: '19882698765432102',
      health: { engineHealth: '90%', batteryStatus: 'Good', brakeStatus: 'Normal', fuelLevel: '78%', temperature: '85°C' },
      serviceHistory: [{ date: '২০২৬-০৯-০৬', issue: 'এসি গ্যাস রিফিল', cost: '৳২,৮০০', mechanic: 'Car Rescue BD' }],
      locationHistory: ['তেজগাঁও শিল্প এলাকা', 'মহাখালী ফ্লাইওভার', 'মিরপুর ১০'],
    },
  ]);

  useEffect(() => {
    const subscription = supabase
      .channel('live-fleet-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'vehicle_locations' }, payload => {
        const updated: any = payload.new;
        setActiveFleets(prev => prev.map(fleet => fleet.id === updated.driver_id ? { ...fleet, lat: updated.latitude, lng: updated.longitude } : fleet));
      })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  const summary = useMemo(() => ({ total: 120, active: 118, breakdown: activeFleets.filter(x => x.alert).length }), [activeFleets]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader
        name={route?.params?.companyName || 'আকিজ লজিস্টিকস হাব'}
        email="B2B Fleet Management"
        role={role}
        avatarText="A"
        navigation={navigation}
        notificationCount={notificationCount}
        onProfile={() => navigation.navigate('ProfileScreen', { role })}
      />

      <View style={styles.subTabRow}>
        <Tab label="Live Tracking" active={subTab === 'tracking'} onPress={() => { setSubTab('tracking'); setSelectedFleet(null); }} icon={<Layers size={16} color={subTab === 'tracking' ? ROLE_MAP[role].color : '#94A3B8'} />} />
        <Tab label="Drivers & Vehicles" active={subTab === 'drivers'} onPress={() => setSubTab('drivers')} icon={<User size={16} color={subTab === 'drivers' ? ROLE_MAP[role].color : '#94A3B8'} />} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.statRow}>
          <StatCard label="Total Fleet" value={summary.total} icon={<Truck size={17} color="#8B5CF6" />} accentColor="#8B5CF6" compact />
          <StatCard label="Active" value={summary.active} icon={<CheckCircle2 size={17} color="#10B981" />} accentColor="#10B981" compact />
        </View>
        <View style={styles.statRow}>
          <StatCard label="Breakdowns" value={summary.breakdown} icon={<AlertTriangle size={17} color="#EF4444" />} accentColor="#EF4444" compact />
          <StatCard label="Business" value="Active" icon={<Building2 size={17} color="#38BDF8" />} accentColor="#38BDF8" compact />
        </View>

        {subTab === 'tracking' && (
          <View>
            <Text style={styles.sectionTitle}>Live Fleet Location</Text>
            <View style={styles.mapCard}>
              <MapView style={StyleSheet.absoluteFillObject} initialRegion={{ latitude: 23.8134, longitude: 90.4168, latitudeDelta: 0.04, longitudeDelta: 0.04 }}>
                {activeFleets.map(fleet => <Marker key={fleet.id} coordinate={{ latitude: fleet.lat, longitude: fleet.lng }} title={fleet.name} description={`Driver: ${fleet.driverName}`} pinColor={fleet.alert ? '#EF4444' : '#10B981'} />)}
              </MapView>
            </View>
            <Text style={styles.sectionTitle}>Fleet Status</Text>
            {activeFleets.map(fleet => <TouchableOpacity key={fleet.id} style={[styles.card, fleet.alert && styles.alertCard]} onPress={() => { setSubTab('drivers'); setSelectedFleet(fleet); }} activeOpacity={0.86}>
              <View style={styles.row}><View style={[styles.iconBox, { backgroundColor: fleet.alert ? '#3D1417' : '#123B2A' }]}><Truck size={18} color={fleet.alert ? '#EF4444' : '#10B981'} /></View><View style={{ flex: 1 }}><Text style={styles.title}>{fleet.name}</Text><Text style={styles.sub}>{fleet.driverName} • {fleet.vehicleNumber}</Text><View style={styles.metaRow}><MapPin size={11} color="#64748B"/><Text style={styles.meta}>{fleet.lat.toFixed(4)}, {fleet.lng.toFixed(4)}</Text></View></View><StatusBadge text={fleet.alert ? 'Maintenance' : 'On Route'} type={fleet.alert ? 'danger' : 'success'} /></View>
            </TouchableOpacity>)}
          </View>
        )}

        {subTab === 'drivers' && !selectedFleet && <View><Text style={styles.sectionTitle}>Registered Drivers & Vehicles</Text>{activeFleets.map(fleet => <TouchableOpacity key={fleet.id} style={styles.card} onPress={() => setSelectedFleet(fleet)}><View style={styles.row}><View style={styles.avatar}><User size={19} color="#8B5CF6" /></View><View style={{ flex: 1 }}><Text style={styles.title}>{fleet.driverName}</Text><Text style={styles.sub}>{fleet.name}</Text><Text style={styles.sub}>{fleet.vehicleNumber}</Text></View>{fleet.alert ? <AlertTriangle size={18} color="#EF4444" /> : <CheckCircle2 size={18} color="#10B981" />}</View></TouchableOpacity>)}</View>}

        {subTab === 'drivers' && selectedFleet && <View>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedFleet(null)}><Text style={styles.backText}>← Back to fleet</Text></TouchableOpacity>
          <View style={styles.card}><Text style={styles.sectionTitle}>Driver & Vehicle Profile</Text><Info label="Driver" value={selectedFleet.driverName} /><Info label="Phone" value={selectedFleet.driverPhone} /><Info label="NID" value={selectedFleet.driverNID} /><Info label="Vehicle" value={`${selectedFleet.name} • ${selectedFleet.vehicleNumber}`} /></View>
          <View style={styles.card}><Text style={styles.sectionTitle}>Vehicle Health</Text><Info label="Engine" value={selectedFleet.health.engineHealth} /><Info label="Battery" value={selectedFleet.health.batteryStatus} /><Info label="Brake" value={selectedFleet.health.brakeStatus} /><Info label="Fuel" value={selectedFleet.health.fuelLevel} /><Info label="Temperature" value={selectedFleet.health.temperature} /></View>
          <View style={styles.card}><Text style={styles.sectionTitle}>Service History</Text>{selectedFleet.serviceHistory.map((service: any, index: number) => <View key={index} style={styles.historyRow}><View style={{ flex: 1 }}><Text style={styles.title}>{service.issue}</Text><Text style={styles.sub}>{service.date} • {service.mechanic}</Text></View><Text style={styles.amount}>{service.cost}</Text></View>)}</View>
          <View style={styles.card}><Text style={styles.sectionTitle}>Location History</Text>{selectedFleet.locationHistory.map((place: string, index: number) => <Text key={index} style={styles.locationItem}>{index + 1}. {place}</Text>)}</View>
        </View>}
      </ScrollView>

      <BottomNavigation activeTab="Home" role={role} navigation={navigation} accentColor="#8B5CF6" />
    </SafeAreaView>
  );
}

function Tab({ label, active, onPress, icon }: any) { return <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={onPress}>{icon}<Text style={[styles.tabText, active && styles.tabActiveText]}>{label}</Text></TouchableOpacity>; }
function Info({ label, value }: { label: string; value: string }) { return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06111F' },
  subTabRow: { flexDirection: 'row', padding: 6, marginHorizontal: 16, marginTop: 10, backgroundColor: '#0D1B2D', borderRadius: 13, borderWidth: 1, borderColor: '#1B2B40' },
  tab: { flex: 1, height: 40, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabActive: { backgroundColor: '#25144D' },
  tabText: { color: '#94A3B8', fontSize: 10, fontWeight: '800' },
  tabActiveText: { color: '#8B5CF6' },
  scroll: { padding: 16, paddingBottom: 18 },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  sectionTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '900', marginBottom: 9 },
  mapCard: { height: 245, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#24364C', marginBottom: 14 },
  card: { backgroundColor: '#0D1B2D', borderRadius: 15, borderWidth: 1, borderColor: '#1B2B40', padding: 13, marginBottom: 10 },
  alertCard: { borderColor: '#7F1D1D' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#25144D', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#F8FAFC', fontSize: 12, fontWeight: '900' },
  sub: { color: '#94A3B8', fontSize: 9, marginTop: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  meta: { color: '#64748B', fontSize: 9 },
  backBtn: { height: 40, borderRadius: 10, backgroundColor: '#17263A', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  backText: { color: '#CBD5E1', fontSize: 11, fontWeight: '800' },
  infoRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1B2B40', flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  infoLabel: { color: '#64748B', fontSize: 10 },
  infoValue: { color: '#F8FAFC', fontSize: 11, fontWeight: '800', flex: 1, textAlign: 'right' },
  historyRow: { paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#1B2B40', flexDirection: 'row', gap: 10 },
  amount: { color: '#F8FAFC', fontSize: 12, fontWeight: '900' },
  locationItem: { color: '#CBD5E1', fontSize: 11, paddingVertical: 6 },
});
