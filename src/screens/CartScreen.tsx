import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react-native';
import { AppRole, ROLE_MAP } from '../components/RoleBadge';
import { CartItem, getCart, getCartTotal, removeFromCart, setCartQuantity, subscribeMarketplace } from '../components/marketplaceStore';

export default function CartScreen({ route, navigation }: any) {
  const role: AppRole = route?.params?.role || 'customer';
  const buyerId = route?.params?.userId || `${role}-demo`;
  const accent = ROLE_MAP[role].color;
  const [cart, setCart] = useState<CartItem[]>(getCart(buyerId));

  useEffect(() => {
    const refresh = () => setCart([...getCart(buyerId)]);
    refresh();
    return subscribeMarketplace(refresh);
  }, [buyerId]);

  const subtotal = getCartTotal(buyerId);
  const delivery = cart.length ? 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#06111F" />
      <View style={styles.header}><TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}><ArrowLeft size={21} color="#F8FAFC" /></TouchableOpacity><Text style={styles.headerTitle}>My Cart</Text><ShoppingCart size={20} color={accent} /></View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {cart.length ? cart.map(item => (
          <View key={item.product.id} style={styles.itemCard}>
            <View style={[styles.emojiBox, { backgroundColor: `${accent}18` }]}><Text style={styles.emoji}>{item.product.emoji}</Text></View>
            <View style={styles.info}><Text numberOfLines={1} style={styles.name}>{item.product.name}</Text><Text style={styles.seller}>{item.product.sellerName}</Text><Text style={styles.price}>৳{item.product.price.toLocaleString('en-BD')}</Text></View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.qty} onPress={() => setCartQuantity(buyerId, item.product.id, item.quantity - 1)}><Minus size={14} color="#F8FAFC" /></TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qty} onPress={() => setCartQuantity(buyerId, item.product.id, item.quantity + 1)}><Plus size={14} color="#F8FAFC" /></TouchableOpacity>
              <TouchableOpacity style={styles.delete} onPress={() => removeFromCart(buyerId, item.product.id)}><Trash2 size={14} color="#F87171" /></TouchableOpacity>
            </View>
          </View>
        )) : <View style={styles.empty}><ShoppingCart size={38} color="#64748B" /><Text style={styles.emptyTitle}>Your cart is empty</Text><Text style={styles.emptyText}>Add vehicle parts from the Store.</Text></View>}

        {cart.length ? <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <Line label="Subtotal" value={`৳${subtotal.toLocaleString('en-BD')}`} />
          <Line label="Delivery" value={`৳${delivery.toLocaleString('en-BD')}`} />
          <View style={styles.totalLine}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>৳{(subtotal + delivery).toLocaleString('en-BD')}</Text></View>
          <TouchableOpacity style={[styles.checkout, { backgroundColor: accent }]} onPress={() => navigation.navigate('CheckoutScreen', { role, userId: buyerId })}><Text style={styles.checkoutText}>Proceed to Checkout</Text></TouchableOpacity>
        </View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Line({ label, value }: { label: string; value: string }) { return <View style={styles.line}><Text style={styles.lineLabel}>{label}</Text><Text style={styles.lineValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06111F' },
  header: { minHeight: 64, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#17263A', gap: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#0D1B2D', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: '#F8FAFC', fontSize: 18, fontWeight: '900' },
  scroll: { padding: 16, paddingBottom: 28 },
  itemCard: { backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#1B2B40', borderRadius: 15, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  emojiBox: { width: 55, height: 55, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 26 },
  info: { flex: 1, minWidth: 0 },
  name: { color: '#F8FAFC', fontSize: 12, fontWeight: '900' },
  seller: { color: '#64748B', fontSize: 9, marginTop: 2 },
  price: { color: '#F8FAFC', fontSize: 13, fontWeight: '900', marginTop: 4 },
  actions: { alignItems: 'center', gap: 5 },
  qty: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#17263A', alignItems: 'center', justifyContent: 'center' },
  qtyText: { color: '#F8FAFC', fontWeight: '900', fontSize: 11 },
  delete: { padding: 6, marginTop: 2 },
  summary: { backgroundColor: '#0D1B2D', borderRadius: 16, borderWidth: 1, borderColor: '#1B2B40', padding: 14, marginTop: 8 },
  summaryTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '900', marginBottom: 9 },
  line: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  lineLabel: { color: '#94A3B8', fontSize: 11 },
  lineValue: { color: '#CBD5E1', fontSize: 11, fontWeight: '700' },
  totalLine: { borderTopWidth: 1, borderTopColor: '#24364C', paddingTop: 11, marginTop: 4, flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { color: '#F8FAFC', fontSize: 13, fontWeight: '900' },
  totalValue: { color: '#F8FAFC', fontSize: 16, fontWeight: '900' },
  checkout: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  checkoutText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  empty: { minHeight: 300, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '900', marginTop: 13 },
  emptyText: { color: '#64748B', fontSize: 11, marginTop: 5 },
});
