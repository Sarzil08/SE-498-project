import React, { useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, CheckCheck, ChevronRight } from 'lucide-react-native';
import { AppHeader, BottomNavigation } from '../components';
import { AppRole, ROLE_MAP } from '../components/RoleBadge';
import { AppNotification, getNotifications, getUnreadCount, markAllRead, subscribeNotifications } from '../components/notificationStore';

export default function NotificationScreen({ route, navigation }: any) {
  const role: AppRole = route?.params?.role || 'customer';
  const accent = ROLE_MAP[role].color;
  const [items, setItems] = useState<AppNotification[]>(getNotifications(role));

  useEffect(() => {
    const refresh = () => setItems([...getNotifications(role)]);
    refresh();
    return subscribeNotifications(refresh);
  }, [role]);

  const unread = getUnreadCount(role);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#06111F" />
      <AppHeader name="Notifications" email={ROLE_MAP[role].label} role={role} navigation={navigation} onBack={() => navigation.goBack()} />
      <View style={styles.actionRow}>
        <Text style={styles.countText}>{unread} unread</Text>
        {unread > 0 && <TouchableOpacity style={styles.readAll} onPress={() => markAllRead(role)}><CheckCheck size={15} color={accent} /><Text style={[styles.readAllText, { color: accent }]}>Mark all read</Text></TouchableOpacity>}
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {items.map(item => <NotificationCard key={item.id} item={item} accent={accent} onOpen={() => { markAllRead(role); if (item.kind === 'store') navigation.navigate('StoreScreen', { role }); }} />)}
        {!items.length && <View style={styles.empty}><Bell size={38} color="#64748B" /><Text style={styles.emptyTitle}>No notifications</Text><Text style={styles.emptyText}>You are all caught up.</Text></View>}
      </ScrollView>
      <BottomNavigation activeTab={null} role={role} navigation={navigation} accentColor={accent} />
    </SafeAreaView>
  );
}

function NotificationCard({ item, accent, onOpen }: { item: AppNotification; accent: string; onOpen: () => void }) {
  return <TouchableOpacity onPress={onOpen} activeOpacity={0.86} style={[styles.card, !item.read && { borderColor: accent }]}>
    <View style={[styles.icon, { backgroundColor: `${accent}18` }]}><Bell size={18} color={accent} /></View>
    <View style={styles.content}><View style={styles.titleRow}><Text style={styles.title}>{item.title}</Text>{!item.read && <View style={[styles.unreadDot, { backgroundColor: accent }]} />}</View><Text style={styles.message}>{item.message}</Text><Text style={styles.time}>{item.time}</Text></View><ChevronRight size={17} color="#64748B" />
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06111F' },
  actionRow: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countText: { color: '#64748B', fontSize: 11, fontWeight: '700' },
  readAll: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  readAllText: { fontSize: 10, fontWeight: '900' },
  scroll: { padding: 16, paddingTop: 4, paddingBottom: 18 },
  card: { backgroundColor: '#0D1B2D', borderRadius: 15, borderWidth: 1, borderColor: '#1B2B40', padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 9 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { color: '#F8FAFC', fontSize: 12, fontWeight: '900', flex: 1 },
  unreadDot: { width: 7, height: 7, borderRadius: 4 },
  message: { color: '#CBD5E1', fontSize: 10, lineHeight: 15, marginTop: 4 },
  time: { color: '#64748B', fontSize: 9, marginTop: 6 },
  empty: { minHeight: 300, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '900', marginTop: 12 },
  emptyText: { color: '#64748B', fontSize: 11, marginTop: 5 },
});
