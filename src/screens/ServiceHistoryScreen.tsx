import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, Clock3, MapPin, PackageCheck, Star } from 'lucide-react-native';
import { AppHeader, BottomNavigation, StatusBadge } from '../components';
import { AppRole, ROLE_MAP } from '../components/RoleBadge';
import { getOrders, StoreOrder, subscribeMarketplace } from '../components/marketplaceStore';
import { getServiceHistory, ServiceHistoryItem, subscribeServiceHistory } from '../components/serviceHistoryStore';

export default function ServiceHistoryScreen({ route, navigation }: any) {
  const role: AppRole = route?.params?.role || 'customer';
  const accent = ROLE_MAP[role].color;
  const buyerId = route?.params?.userId || `${role}-demo`;
  const [services, setServices] = useState<ServiceHistoryItem[]>(getServiceHistory(role));
  const [orders, setOrders] = useState<StoreOrder[]>(getOrders(buyerId));
  const [tab, setTab] = useState<'service' | 'orders'>('service');

  useEffect(() => {
    const refresh = () => {
      setServices([...getServiceHistory(role)]);
      setOrders([...getOrders(buyerId)]);
    };
    refresh();
    const a = subscribeServiceHistory(refresh);
    const b = subscribeMarketplace(refresh);
    return () => { a(); b(); };
  }, [role, buyerId]);

  const title = tab === 'service' ? 'Service & Rescue History' : 'Parts Order History';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#06111F" />
      <AppHeader name="History" email={ROLE_MAP[role].label} role={role} navigation={navigation} onBack={() => navigation.goBack()} />
      <View style={styles.switchRow}>
        <TouchableOpacity style={[styles.switchBtn, tab === 'service' && { backgroundColor: `${accent}22`, borderColor: accent }]} onPress={() => setTab('service')}><Clock3 size={15} color={tab === 'service' ? accent : '#94A3B8'} /><Text style={[styles.switchText, tab === 'service' && { color: accent }]}>Services</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.switchBtn, tab === 'orders' && { backgroundColor: `${accent}22`, borderColor: accent }]} onPress={() => setTab('orders')}><PackageCheck size={15} color={tab === 'orders' ? accent : '#94A3B8'} /><Text style={[styles.switchText, tab === 'orders' && { color: accent }]}>Parts Orders</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>{title}</Text>
        {tab === 'service' ? services.map(item => <ServiceCard key={item.id} item={item} accent={accent} />) : orders.map(order => <OrderHistoryCard key={order.id} order={order} accent={accent} />)}
        {tab === 'service' && !services.length && <Empty title="No service history" text="Completed roadside services will appear here." />}
        {tab === 'orders' && !orders.length && <Empty title="No parts orders" text="Your Store orders will appear here." />}
      </ScrollView>
      <BottomNavigation activeTab="History" role={role} navigation={navigation} accentColor={accent} />
    </SafeAreaView>
  );
}

function ServiceCard({ item, accent }: { item: ServiceHistoryItem; accent: string }) {
  return <View style={styles.card}>
    <View style={[styles.iconBox, { backgroundColor: `${accent}18` }]}><CheckCircle2 size={19} color={accent} /></View>
    <View style={styles.content}><Text style={styles.title}>{item.title}</Text><Text style={styles.partner}>{item.partner}</Text><View style={styles.metaRow}>{item.location && <><MapPin size={11} color="#64748B" /><Text style={styles.meta}>{item.location}</Text></>}<Text style={styles.meta}>• {item.date}</Text></View>{item.rating ? <View style={styles.rating}><Star size={12} color="#FBBF24" fill="#FBBF24" /><Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text></View> : null}</View>
    <View style={styles.amountBox}><Text style={styles.amount}>{item.amount}</Text><StatusBadge text={item.status === 'completed' ? 'Completed' : item.status} type={item.status === 'completed' ? 'success' : item.status === 'cancelled' ? 'danger' : 'warning'} /></View>
  </View>;
}

function OrderHistoryCard({ order, accent }: { order: StoreOrder; accent: string }) {
  return <View style={styles.card}><View style={[styles.iconBox, { backgroundColor: `${accent}18` }]}><PackageCheck size={19} color={accent} /></View><View style={styles.content}><Text style={styles.title}>{order.id}</Text><Text numberOfLines={1} style={styles.partner}>{order.items.map(x => `${x.name} ×${x.quantity}`).join(', ')}</Text><Text style={styles.meta}>{order.date} • {order.sellerName}</Text></View><View style={styles.amountBox}><Text style={styles.amount}>৳{order.total.toLocaleString('en-BD')}</Text><StatusBadge text={order.status} type="info" /></View></View>;
}

function Empty({ title, text }: { title: string; text: string }) { return <View style={styles.empty}><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyText}>{text}</Text></View>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06111F' },
  switchRow: { paddingHorizontal: 16, paddingTop: 9, paddingBottom: 4, flexDirection: 'row', gap: 8 },
  switchBtn: { flex: 1, height: 42, borderRadius: 11, borderWidth: 1, borderColor: '#24364C', backgroundColor: '#0D1B2D', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  switchText: { color: '#94A3B8', fontSize: 10, fontWeight: '900' },
  scroll: { padding: 16, paddingTop: 8, paddingBottom: 18 },
  pageTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '900', marginBottom: 10 },
  card: { backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#1B2B40', borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  iconBox: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, minWidth: 0 },
  title: { color: '#F8FAFC', fontSize: 12, fontWeight: '900' },
  partner: { color: '#CBD5E1', fontSize: 10, marginTop: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  meta: { color: '#64748B', fontSize: 9 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  ratingText: { color: '#FBBF24', fontSize: 9, fontWeight: '800' },
  amountBox: { alignItems: 'flex-end', gap: 6 },
  amount: { color: '#F8FAFC', fontSize: 13, fontWeight: '900' },
  empty: { minHeight: 220, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 25 },
  emptyTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '900' },
  emptyText: { color: '#64748B', fontSize: 11, textAlign: 'center', marginTop: 6, lineHeight: 16 },
});
