import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accentColor?: string;
  compact?: boolean;
};

export default function StatCard({
  label,
  value,
  icon,
  accentColor = '#1687FF',
  compact = false,
}: Props) {
  return (
    <View style={[styles.card, compact && styles.compact]}>
      <View style={[styles.icon, { backgroundColor: `${accentColor}22` }]}>
        {icon}
      </View>
      <View style={styles.texts}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 86,
    padding: 13,
    borderRadius: 15,
    backgroundColor: '#0D1B2D',
    borderWidth: 1,
    borderColor: '#1B2B40',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compact: {
    minHeight: 72,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
  },
  label: {
    color: '#94A3B8',
    fontSize: 11,
  },
  value: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
});
