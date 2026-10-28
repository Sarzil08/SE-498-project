import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function CategoryChip({ label, active, onPress, accentColor = '#1687FF' }: { label: string; active: boolean; onPress: () => void; accentColor?: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={[styles.chip, active && { backgroundColor: `${accentColor}22`, borderColor: accentColor }]}
    >
      <Text style={[styles.text, active && { color: accentColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#24364C', marginRight: 8 },
  text: { color: '#94A3B8', fontSize: 11, fontWeight: '800' },
});
