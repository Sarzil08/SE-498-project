import React, { useMemo } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Minus, Plus, ShoppingCart, Star } from 'lucide-react-native';
import { addToCart, getCartCount, getProducts } from '../components/marketplaceStore';
import { AppRole, ROLE_MAP } from '../components/RoleBadge';

export default function ProductDetailsScreen({ route, navigation }: any) {
  const role: AppRole = route?.params?.role || 'customer';
  const buyerId = route?.params?.userId || `${role}-demo`;
  const productId = route?.params?.productId;
  const accent = ROLE_MAP[role].color;
  const [quantity, setQuantity] = React.useState(1);
  const product = React.useMemo(() => getProducts().find(p => p.id === productId), [productId]);

  React.useEffect(() => {
    if (route?.params?.quickAdd && product) {
      try {
        addToCart(buyerId, product.id, 1);
        Alert.alert('Added to cart', `${product.name} was added to your cart.`);
      } catch (e: any) {
        Alert.alert('Unable to add', e.message);
      }
      navigation.setParams({ quickAdd: false });
    }
  }, [route?.params?.quickAdd, product?.id, buyerId]);

  const add = () => {
    if (!product) return;
    try {
      addToCart(buyerId, product.id, quantity);
      Alert.alert('Added to cart', `${product.name} ×${quantity} added successfully.`, [
        { text: 'Continue' },
        { text: 'Open Cart', onPress: () => navigation.navigate('CartScreen', { role, userId: buyerId }) },
      ]);
    } catch (e: any) {
      Alert.alert('Unable to add', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#06111F" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}><ArrowLeft size={21} color="#F8FAFC" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('CartScreen', { role, userId: buyerId })}><ShoppingCart size={19} color="#F8FAFC" /></TouchableOpacity>
      </View>

      {!product ? (
        <View style={styles.center}><Text style={styles.title}>Product not found</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.imageBox, { backgroundColor: `${accent}18`, borderColor: accent }]}><Text style={styles.emoji}>{product.emoji}</Text></View>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.brand}>{product.brand} • {product.condition}</Text>
          <View style={styles.ratingRow}><Star size={15} color="#FBBF24" fill="#FBBF24" /><Text style={styles.rating}>{product.rating.toFixed(1)}</Text><Text style={styles.dot}>•</Text><Text style={styles.meta}>{product.sales} sold</Text></View>
          <Text style={styles.price}>৳{product.price.toLocaleString('en-BD')}</Text>

          <View style={styles.card}><Text style={styles.cardTitle}>Seller</Text><Text style={styles.value}>{product.sellerName}</Text><View style={styles.locationRow}><MapPin size={14} color="#64748B" /><Text style={styles.location}>{product.area}</Text></View></View>
          <View style={styles.card}><Text style={styles.cardTitle}>Compatibility</Text><Text style={styles.description}>{product.compatibility}</Text></View>
          <View style={styles.card}><Text style={styles.cardTitle}>Description</Text><Text style={styles.description}>{product.description}</Text></View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quantity</Text>
            <View style={styles.quantityRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))}><Minus size={18} color="#F8FAFC" /></TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => Math.min(product.stock, q + 1))}><Plus size={18} color="#F8FAFC" /></TouchableOpacity>
              <Text style={styles.stockText}>{product.stock} in stock</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.buyBtn, { backgroundColor: accent }]} onPress={add}><ShoppingCart size={18} color="#FFF" /><Text style={styles.buyText}>Add to Cart • ৳{(product.price * quantity).toLocaleString('en-BD')}</Text></TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06111F' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { minHeight: 64, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#17263A' },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#0D1B2D', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: '#F8FAFC', fontSize: 18, fontWeight: '900', marginHorizontal: 11 },
  scroll: { padding: 16, paddingBottom: 24 },
  imageBox: { height: 200, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emoji: { fontSize: 78 },
  name: { color: '#F8FAFC', fontSize: 24, fontWeight: '900' },
  brand: { color: '#94A3B8', fontSize: 12, marginTop: 5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  rating: { color: '#FBBF24', fontSize: 12, fontWeight: '900' },
  dot: { color: '#475569' },
  meta: { color: '#94A3B8', fontSize: 11 },
  price: { color: '#F8FAFC', fontSize: 23, fontWeight: '900', marginTop: 12, marginBottom: 14 },
  card: { backgroundColor: '#0D1B2D', borderRadius: 15, borderWidth: 1, borderColor: '#1B2B40', padding: 14, marginBottom: 10 },
  cardTitle: { color: '#94A3B8', fontSize: 10, fontWeight: '800', marginBottom: 6 },
  value: { color: '#F8FAFC', fontSize: 13, fontWeight: '800' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  location: { color: '#64748B', fontSize: 10 },
  description: { color: '#CBD5E1', fontSize: 12, lineHeight: 18 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#17263A', alignItems: 'center', justifyContent: 'center' },
  qtyText: { color: '#F8FAFC', fontSize: 16, fontWeight: '900' },
  stockText: { color: '#64748B', fontSize: 10, marginLeft: 3 },
  buyBtn: { height: 52, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 },
  buyText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  title: { color: '#F8FAFC', fontSize: 16, fontWeight: '900' },
});
