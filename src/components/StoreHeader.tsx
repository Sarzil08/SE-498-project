import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Search, ShoppingCart } from 'lucide-react-native';

export default function StoreHeader({
  search,
  onSearch,
  cartCount = 0,
  onCart,
  title = 'Car Rescue Store',
}: {
  search: string;
  onSearch: (value: string) => void;
  cartCount?: number;
  onCart?: () => void;
  title?: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Genuine vehicle parts marketplace</Text>
        </View>
        <TouchableOpacity style={styles.cartButton} onPress={onCart} activeOpacity={0.82}>
          <ShoppingCart size={20} color="#F8FAFC" />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Search size={18} color="#64748B" />
        <TextInput
          value={search}
          onChangeText={onSearch}
          placeholder="Search parts, brands or vehicle..."
          placeholderTextColor="#64748B"
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  title: { color: '#F8FAFC', fontSize: 22, fontWeight: '900' },
  subtitle: { color: '#64748B', fontSize: 11, marginTop: 3 },
  cartButton: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#24364C', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  badge: { position: 'absolute', right: -4, top: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#06111F', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  searchBox: { height: 46, borderRadius: 13, backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#24364C', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, color: '#F8FAFC', fontSize: 13, paddingVertical: 0 },
});
