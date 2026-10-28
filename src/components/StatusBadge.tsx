import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  text: string;
  type?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
};

const COLORS = {
  success: { bg: '#123B2A', fg: '#34D399' },
  warning: { bg: '#3D2D0A', fg: '#FBBF24' },
  danger: { bg: '#3D1417', fg: '#F87171' },
  info: { bg: '#0A2F4A', fg: '#38BDF8' },
  neutral: { bg: '#1E293B', fg: '#CBD5E1' },
};

export default function StatusBadge({ text, type = 'info' }: Props) {
  const colors = COLORS[type];
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.dot, { backgroundColor: colors.fg }]} />
      <Text style={[styles.text, { color: colors.fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
  },
});
