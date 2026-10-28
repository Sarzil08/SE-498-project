import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PackageCheck } from 'lucide-react-native';
import { StoreOrder } from './marketplaceStore';
import StatusBadge from './StatusBadge';

export default function OrderCard({ order }: { order: StoreOrder }) {
  const type = order.status === 'Delivered' ? 'success' : order.status === 'Cancelled' ? 'danger' : order.status === 'Processing' ? 'warning' : 'info';
  return (
    <View style={styles.card}>
      <View style={styles.icon}><PackageCheck size={18} color="#38BDF8" /></View>
      <View style={styles.content}>
        <Text style={styles.id}>{order.id}</Text>
        <Text numberOfLines={1} style={styles.items}>{order.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}</Text>
        <Text style={styles.meta}>{order.date} • {order.sellerName}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>৳{order.total.toLocaleString('en-BD')}</Text>
        <StatusBadge text={order.status} type={type as any} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0D1B2D', borderRadius: 15, borderWidth: 1, borderColor: '#1B2B40', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#0A2F4A', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, minWidth: 0 },
  id: { color: '#F8FAFC', fontWeight: '900', fontSize: 12 },
  items: { color: '#CBD5E1', fontSize: 10, marginTop: 3 },
  meta: { color: '#64748B', fontSize: 9, marginTop: 4 },
  right: { alignItems: 'flex-end', gap: 5 },
  amount: { color: '#F8FAFC', fontSize: 13, fontWeight: '900' },
});
