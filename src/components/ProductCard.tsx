import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MapPin, Plus, Star } from 'lucide-react-native';
import { Product } from './marketplaceStore';

export default function ProductCard({ product, onPress, onAdd, accentColor = '#1687FF', showAdd = true }: { product: Product; onPress: () => void; onAdd: () => void; accentColor?: string; showAdd?: boolean }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.86}>
      <View style={[styles.productIcon, { backgroundColor: `${accentColor}18` }]}>
        <Text style={styles.emoji}>{product.emoji}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.name}>{product.name}</Text>
          {product.sales >= 40 && <View style={styles.bestBadge}><Text style={styles.bestText}>BEST SELLER</Text></View>}
        </View>
        <Text numberOfLines={1} style={styles.brand}>{product.brand} • {product.condition}</Text>
        <View style={styles.metaRow}>
          <Star size={12} color="#FBBF24" fill="#FBBF24" />
          <Text style={styles.meta}>{product.rating.toFixed(1)}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.meta}>{product.sales} sold</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.price}>৳{product.price.toLocaleString('en-BD')}</Text>
          <View style={styles.location}><MapPin size={11} color="#64748B" /><Text numberOfLines={1} style={styles.locationText}>{product.area}</Text></View>
        </View>
      </View>
      {showAdd && (
        <TouchableOpacity style={[styles.addButton, { backgroundColor: accentColor }]} onPress={onAdd} activeOpacity={0.85}>
          <Plus size={18} color="#FFF" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#0D1B2D', borderRadius: 16, borderWidth: 1, borderColor: '#1B2B40', marginBottom: 10, gap: 11 },
  productIcon: { width: 62, height: 62, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 27 },
  content: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flex: 1, color: '#F8FAFC', fontSize: 13, fontWeight: '900' },
  bestBadge: { paddingHorizontal: 5, paddingVertical: 3, borderRadius: 5, backgroundColor: '#3B2500' },
  bestText: { color: '#FBBF24', fontSize: 7, fontWeight: '900' },
  brand: { color: '#94A3B8', fontSize: 10, marginTop: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  meta: { color: '#CBD5E1', fontSize: 9, fontWeight: '700' },
  dot: { color: '#475569', fontSize: 9 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7, gap: 6 },
  price: { color: '#F8FAFC', fontSize: 16, fontWeight: '900' },
  location: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1, justifyContent: 'flex-end' },
  locationText: { color: '#64748B', fontSize: 9, maxWidth: 100 },
  addButton: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
