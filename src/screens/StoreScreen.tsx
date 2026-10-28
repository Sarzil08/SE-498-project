import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Building2, Car, Plus, Store as StoreIcon, Truck, Wrench, X } from 'lucide-react-native';
import { AppHeader, BottomNavigation, CategoryChip, ProductCard, StatusBadge } from '../components';
import { AppRole, ROLE_MAP } from '../components/RoleBadge';
import { addProduct, getCartCount, getSellerOrders, getSellerProducts, getProducts, Product, subscribeMarketplace } from '../components/marketplaceStore';
import OrderCard from '../components/OrderCard';
import { addNotification } from '../components/notificationStore';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';

type AreaMode = 'nearby' | 'all';
type SortKey = 'best' | 'low' | 'high' | 'newest';

const CATEGORIES = ['All', 'Engine', 'Brake', 'Battery', 'Tyre', 'Filter', 'Electrical'];

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function StoreScreen({ route, navigation }: any) {
  const role: AppRole = route?.params?.role || 'customer';
  const accent = ROLE_MAP[role].color;
  const [products, setProducts] = useState<Product[]>(getProducts());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [areaMode, setAreaMode] = useState<AreaMode>('nearby');
  const [sort, setSort] = useState<SortKey>('best');
  const [cartCount, setCartCount] = useState(getCartCount(route?.params?.userId || role));
  const [location, setLocation] = useState({ latitude: 23.8103, longitude: 90.4125 });
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const notificationCount = useUnreadNotifications(role);

  const buyerId = route?.params?.userId || `${role}-demo`;
  const isSeller = role === 'mechanic';
  const sellerId = route?.params?.sellerId || 'mech-01';

  const [newProduct, setNewProduct] = useState({
    name: '', category: 'Engine', brand: '', price: '', stock: '', condition: 'New' as 'New' | 'Used', compatibility: '', description: '', emoji: '🔧', area: 'Dhaka', division: 'Dhaka',
  });

  useEffect(() => {
    setProducts(getProducts());
    setCartCount(getCartCount(buyerId));
    const unsub = subscribeMarketplace(() => {
      setProducts(getProducts());
      setCartCount(getCartCount(buyerId));
    });
    return unsub;
  }, [buyerId]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        }
      } catch {}
    })();
  }, []);

  const filteredProducts = useMemo(() => {
    let list = products.filter(p => {
      const matchesSearch = !search.trim() || `${p.name} ${p.brand} ${p.compatibility}`.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || p.category === category;
      const distance = distanceKm(location.latitude, location.longitude, p.latitude, p.longitude);
      const matchesArea = areaMode === 'all' || distance <= 35;
      return matchesSearch && matchesCategory && matchesArea;
    });

    list = [...list].sort((a, b) => {
      if (sort === 'best') return b.sales - a.sales;
      if (sort === 'low') return a.price - b.price;
      if (sort === 'high') return b.price - a.price;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list;
  }, [products, search, category, areaMode, sort, location]);

  const sellerProducts = getSellerProducts(sellerId);
  const sellerOrders = getSellerOrders(sellerId);
  const sellerSales = sellerOrders.reduce((sum, o) => sum + o.total, 0);

  const publishProduct = () => {
    const price = Number(newProduct.price);
    const stock = Number(newProduct.stock);
    if (!newProduct.name.trim() || !newProduct.brand.trim() || !price || !stock || !newProduct.compatibility.trim()) {
      Alert.alert('Missing information', 'Product name, brand, price, stock and compatibility are required.');
      return;
    }

    addProduct({
      sellerId,
      sellerName: route?.params?.sellerName || 'Mechanic Store',
      name: newProduct.name.trim(),
      category: newProduct.category,
      brand: newProduct.brand.trim(),
      price,
      stock,
      condition: newProduct.condition,
      compatibility: newProduct.compatibility.trim(),
      description: newProduct.description.trim(),
      emoji: newProduct.emoji || '🔧',
      area: newProduct.area || 'Dhaka',
      division: newProduct.division || 'Dhaka',
      latitude: location.latitude,
      longitude: location.longitude,
    });
    addNotification({ role: 'mechanic', title: 'Product published', message: `${newProduct.name} is now visible in your store.`, kind: 'store' });
    setIsAddProductOpen(false);
    setNewProduct({ name: '', category: 'Engine', brand: '', price: '', stock: '', condition: 'New', compatibility: '', description: '', emoji: '🔧', area: 'Dhaka', division: 'Dhaka' });
    Alert.alert('Published', 'Your part has been added to the store.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#06111F" />
      <AppHeader
        name={isSeller ? 'My Store' : 'Car Rescue Store'}
        email={isSeller ? 'Sell and manage vehicle parts' : 'Parts marketplace'}
        role={role}
        avatarText={isSeller ? 'M' : undefined}
        navigation={navigation}
        notificationCount={notificationCount}
        onProfile={() => navigation.navigate('ProfileScreen', { role })}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isSeller ? (
          <>
            <View style={styles.heroCard}>
              <View style={[styles.heroIcon, { backgroundColor: `${accent}20` }]}><StoreIcon size={26} color={accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Mechanic Seller Center</Text>
                <Text style={styles.heroSub}>List parts, manage stock and track orders.</Text>
              </View>
              <TouchableOpacity style={[styles.addProductButton, { backgroundColor: accent }]} onPress={() => setIsAddProductOpen(true)}>
                <Plus size={17} color="#FFF" /><Text style={styles.addProductText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.smallStat}><Text style={styles.statValue}>{sellerProducts.length}</Text><Text style={styles.statLabel}>Products</Text></View>
              <View style={styles.smallStat}><Text style={styles.statValue}>{sellerOrders.length}</Text><Text style={styles.statLabel}>Orders</Text></View>
              <View style={styles.smallStat}><Text style={styles.statValue}>৳{sellerSales.toLocaleString('en-BD')}</Text><Text style={styles.statLabel}>Sales</Text></View>
            </View>

            <Text style={styles.sectionTitle}>My Products</Text>
            {sellerProducts.length ? sellerProducts.map(product => (
              <ProductCard key={product.id} product={product} onPress={() => {}} onAdd={() => {}} showAdd={false} accentColor={accent} />
            )) : <Text style={styles.emptyText}>No products yet. Add your first part.</Text>}

            <Text style={styles.sectionTitle}>Seller Orders</Text>
            {sellerOrders.length ? sellerOrders.map(order => <OrderCard key={order.id} order={order} />) : <Text style={styles.emptyText}>No store orders yet.</Text>}
          </>
        ) : (
          <>
            <View style={styles.toggleRow}>
              <TouchableOpacity onPress={() => setAreaMode('nearby')} style={[styles.areaBtn, areaMode === 'nearby' && { backgroundColor: `${accent}22`, borderColor: accent }]}>
                <MapPinSmall />
                <Text style={[styles.areaText, areaMode === 'nearby' && { color: accent }]}>Nearby area</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAreaMode('all')} style={[styles.areaBtn, areaMode === 'all' && { backgroundColor: `${accent}22`, borderColor: accent }]}>
                <Text style={[styles.areaText, areaMode === 'all' && { color: accent }]}>All Bangladesh</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 11 }}>
              {CATEGORIES.map(item => <CategoryChip key={item} label={item} active={category === item} onPress={() => setCategory(item)} accentColor={accent} />)}
            </ScrollView>

            <View style={styles.sortRow}>
              <Text style={styles.results}>{filteredProducts.length} parts available</Text>
              <View style={styles.sortButtons}>
                <SortButton label="Best Sell" active={sort === 'best'} onPress={() => setSort('best')} />
                <SortButton label="Low → High" active={sort === 'low'} onPress={() => setSort('low')} />
                <SortButton label="High → Low" active={sort === 'high'} onPress={() => setSort('high')} />
                <SortButton label="Newest" active={sort === 'newest'} onPress={() => setSort('newest')} />
              </View>
            </View>

            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                accentColor={accent}
                showAdd
                onPress={() => navigation.navigate('ProductDetailsScreen', { productId: product.id, role, userId: buyerId })}
                onAdd={() => {
                  try {
                    // Details screen owns the add-to-cart path so the user can review compatibility.
                    navigation.navigate('ProductDetailsScreen', { productId: product.id, role, userId: buyerId, quickAdd: true });
                  } catch (e: any) { Alert.alert('Error', e.message); }
                }}
              />
            ))}

            {!filteredProducts.length && <Text style={styles.emptyText}>No matching parts found in this area/filter.</Text>}
          </>
        )}
      </ScrollView>

      <BottomNavigation activeTab="Store" role={role} navigation={navigation} accentColor={accent} />

      <Modal visible={isAddProductOpen} animationType="slide" transparent onRequestClose={() => setIsAddProductOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Add Product</Text><TouchableOpacity onPress={() => setIsAddProductOpen(false)}><X size={21} color="#94A3B8" /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Input label="Product Name" value={newProduct.name} onChangeText={v => setNewProduct(p => ({ ...p, name: v }))} />
              <Input label="Brand" value={newProduct.brand} onChangeText={v => setNewProduct(p => ({ ...p, brand: v }))} />
              <Input label="Price" value={newProduct.price} keyboardType="numeric" onChangeText={v => setNewProduct(p => ({ ...p, price: v }))} />
              <Input label="Stock" value={newProduct.stock} keyboardType="numeric" onChangeText={v => setNewProduct(p => ({ ...p, stock: v }))} />
              <Input label="Compatible Vehicle" value={newProduct.compatibility} onChangeText={v => setNewProduct(p => ({ ...p, compatibility: v }))} />
              <Input label="Description" value={newProduct.description} multiline onChangeText={v => setNewProduct(p => ({ ...p, description: v }))} />
              <Text style={styles.inputLabel}>Condition</Text>
              <View style={styles.conditionRow}>
                {(['New', 'Used'] as const).map(value => (
                  <TouchableOpacity key={value} style={[styles.conditionBtn, newProduct.condition === value && { borderColor: accent, backgroundColor: `${accent}22` }]} onPress={() => setNewProduct(p => ({ ...p, condition: value }))}><Text style={[styles.conditionText, newProduct.condition === value && { color: accent }]}>{value}</Text></TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>{CATEGORIES.filter(x => x !== 'All').map(value => <CategoryChip key={value} label={value} active={newProduct.category === value} onPress={() => setNewProduct(p => ({ ...p, category: value }))} accentColor={accent} />)}</ScrollView>
              <TouchableOpacity style={[styles.publishBtn, { backgroundColor: accent }]} onPress={publishProduct}><Text style={styles.publishText}>Publish Product</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SortButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} style={[styles.sortButton, active && styles.sortActive]}><Text style={[styles.sortText, active && styles.sortTextActive]}>{label}</Text></TouchableOpacity>;
}

function Input({ label, value, onChangeText, keyboardType, multiline }: any) {
  return <View style={{ marginBottom: 11 }}><Text style={styles.inputLabel}>{label}</Text><TextInput style={[styles.modalInput, multiline && { height: 76, textAlignVertical: 'top' }]} value={value} onChangeText={onChangeText} keyboardType={keyboardType} multiline={multiline} placeholderTextColor="#64748B" /></View>;
}

function MapPinSmall() { return <Text style={{ fontSize: 13 }}>📍</Text>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06111F' },
  scroll: { padding: 16, paddingBottom: 18 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  areaBtn: { flex: 1, height: 43, borderRadius: 12, borderWidth: 1, borderColor: '#24364C', backgroundColor: '#0D1B2D', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  areaText: { color: '#94A3B8', fontSize: 11, fontWeight: '900' },
  sortRow: { marginBottom: 10 },
  results: { color: '#CBD5E1', fontSize: 12, fontWeight: '800', marginBottom: 7 },
  sortButtons: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  sortButton: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 9, backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#24364C' },
  sortActive: { backgroundColor: '#17263A', borderColor: '#38BDF8' },
  sortText: { color: '#64748B', fontSize: 9, fontWeight: '800' },
  sortTextActive: { color: '#38BDF8' },
  emptyText: { color: '#64748B', fontSize: 12, textAlign: 'center', marginTop: 24 },
  heroCard: { backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#24364C', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  heroIcon: { width: 45, height: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '900' },
  heroSub: { color: '#94A3B8', fontSize: 10, marginTop: 3, lineHeight: 14 },
  addProductButton: { height: 36, paddingHorizontal: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  addProductText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  smallStat: { flex: 1, backgroundColor: '#0D1B2D', borderRadius: 13, borderWidth: 1, borderColor: '#1B2B40', padding: 11, alignItems: 'center' },
  statValue: { color: '#F8FAFC', fontSize: 16, fontWeight: '900' },
  statLabel: { color: '#64748B', fontSize: 9, marginTop: 2 },
  sectionTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '900', marginBottom: 9, marginTop: 3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  modalCard: { maxHeight: '88%', backgroundColor: '#081523', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderColor: '#24364C', padding: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '900' },
  inputLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '800', marginBottom: 5 },
  modalInput: { minHeight: 42, backgroundColor: '#0D1B2D', color: '#F8FAFC', borderWidth: 1, borderColor: '#24364C', borderRadius: 11, paddingHorizontal: 11, fontSize: 12 },
  conditionRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  conditionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#24364C', alignItems: 'center', backgroundColor: '#0D1B2D' },
  conditionText: { color: '#94A3B8', fontWeight: '800', fontSize: 11 },
  publishBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 5, marginBottom: 20 },
  publishText: { color: '#FFF', fontWeight: '900', fontSize: 13 },
});
