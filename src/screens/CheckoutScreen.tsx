import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, WalletCards } from 'lucide-react-native';
import { AppRole, ROLE_MAP } from '../components/RoleBadge';
import { getCartTotal, getCart, placeOrder } from '../components/marketplaceStore';
import { addNotification } from '../components/notificationStore';

export default function CheckoutScreen({ route, navigation }: any) {
  const role: AppRole = route?.params?.role || 'customer';
  const buyerId = route?.params?.userId || `${role}-demo`;
  const accent = ROLE_MAP[role].color;
  const [address, setAddress] = useState('Dhaka, Bangladesh');
  const [payment, setPayment] = useState('Cash on Delivery');
  const cartTotal = getCartTotal(buyerId);
  const delivery = getCart(buyerId).length ? 100 : 0;
  const total = cartTotal + delivery;

  useEffect(() => {
    if (!getCart(buyerId).length) navigation.goBack();
  }, []);

  const submit = () => {
    if (!address.trim()) {
      Alert.alert('Address required', 'Please enter a delivery address.');
      return;
    }
    try {
      const result = placeOrder(buyerId, role, address.trim(), payment);
      addNotification({ role, title: 'Order confirmed', message: `${result.order.id} has been confirmed for ৳${result.order.total.toLocaleString('en-BD')}.`, kind: 'store' });
      addNotification({ role: 'mechanic', title: 'New store order', message: `A new parts order ${result.order.id} has been placed.`, kind: 'store' });
      Alert.alert('Order placed', `Your order ${result.order.id} has been confirmed.`, [{ text: 'View History', onPress: () => navigation.replace('ServiceHistory', { role }) }]);
    } catch (e: any) {
      Alert.alert('Checkout failed', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#06111F" />
      <View style={styles.header}><TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}><ArrowLeft size={21} color="#F8FAFC" /></TouchableOpacity><Text style={styles.headerTitle}>Checkout</Text><WalletCards size={20} color={accent} /></View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Section title="Delivery Address" icon={<MapPin size={16} color={accent} />}>
          <TextInput value={address} onChangeText={setAddress} style={styles.input} placeholder="Full delivery address" placeholderTextColor="#64748B" multiline />
        </Section>
        <Section title="Payment Method" icon={<WalletCards size={16} color={accent} />}>
          {['Cash on Delivery', 'Online Payment'].map(method => <TouchableOpacity key={method} onPress={() => setPayment(method)} style={[styles.paymentOption, payment === method && { borderColor: accent, backgroundColor: `${accent}18` }]}><View style={[styles.radio, payment === method && { backgroundColor: accent }]} /><Text style={styles.paymentText}>{method}</Text></TouchableOpacity>)}
        </Section>
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <Line label="Parts" value={`৳${cartTotal.toLocaleString('en-BD')}`} />
          <Line label="Delivery" value={`৳${delivery.toLocaleString('en-BD')}`} />
          <View style={styles.totalLine}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>৳{total.toLocaleString('en-BD')}</Text></View>
        </View>
        <TouchableOpacity style={[styles.placeBtn, { backgroundColor: accent }]} onPress={submit}><Text style={styles.placeText}>Place Order • ৳{total.toLocaleString('en-BD')}</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, icon, children }: any) { return <View style={styles.section}><View style={styles.sectionHeader}>{icon}<Text style={styles.sectionTitle}>{title}</Text></View>{children}</View>; }
function Line({ label, value }: { label: string; value: string }) { return <View style={styles.line}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06111F' },
  header: { minHeight: 64, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderColor: '#17263A' },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#0D1B2D', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: '#F8FAFC', fontSize: 18, fontWeight: '900' },
  scroll: { padding: 16, paddingBottom: 28 },
  section: { backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#1B2B40', borderRadius: 15, padding: 14, marginBottom: 11 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  sectionTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '900' },
  input: { minHeight: 72, backgroundColor: '#06111F', borderWidth: 1, borderColor: '#24364C', borderRadius: 11, color: '#F8FAFC', padding: 11, textAlignVertical: 'top', fontSize: 12 },
  paymentOption: { minHeight: 47, borderRadius: 11, borderWidth: 1, borderColor: '#24364C', backgroundColor: '#06111F', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, marginBottom: 7 },
  radio: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#24364C' },
  paymentText: { color: '#CBD5E1', fontSize: 11, fontWeight: '800' },
  summary: { backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#1B2B40', borderRadius: 15, padding: 14, marginBottom: 12 },
  summaryTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '900', marginBottom: 9 },
  line: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  label: { color: '#94A3B8', fontSize: 11 },
  value: { color: '#CBD5E1', fontSize: 11, fontWeight: '800' },
  totalLine: { borderTopWidth: 1, borderTopColor: '#24364C', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { color: '#F8FAFC', fontSize: 13, fontWeight: '900' },
  totalValue: { color: '#F8FAFC', fontSize: 16, fontWeight: '900' },
  placeBtn: { height: 52, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  placeText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
});
