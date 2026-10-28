import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Building2, Car, User, Wrench } from 'lucide-react-native';

export type AppRole = 'customer' | 'mechanic' | 'b2b' | 'driver';

const ROLE_MAP: Record<AppRole, { label: string; color: string; Icon: any }> = {
  customer: { label: 'Customer', color: '#1687FF', Icon: User },
  mechanic: { label: 'Mechanic', color: '#16C784', Icon: Wrench },
  b2b: { label: 'B2B', color: '#8B5CF6', Icon: Building2 },
  driver: { label: 'Driver', color: '#FF8A00', Icon: Car },
};

export default function RoleBadge({ role, compact = false }: { role: AppRole; compact?: boolean }) {
  const config = ROLE_MAP[role];
  const Icon = config.Icon;

  return (
    <View style={[styles.container, { backgroundColor: config.color }]}>
      <Icon size={14} color="#FFF" />
      {!compact && <Text style={styles.text}>{config.label}</Text>}
    </View>
  );
}

export { ROLE_MAP };

const styles = StyleSheet.create({
  container: {
    minHeight: 22,
    paddingHorizontal: 7,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
