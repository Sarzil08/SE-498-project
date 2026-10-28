import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

type Props = {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onPress: () => void;
  accentColor?: string;
  badge?: string;
};

export default function QuickActionCard({
  title,
  subtitle,
  icon,
  onPress,
  accentColor = '#1687FF',
  badge,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.wrapper}
    >
      <View style={[styles.icon, { backgroundColor: `${accentColor}22` }]}>
        {icon}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
          {!!badge && (
            <View style={[styles.badge, { backgroundColor: accentColor }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        {!!subtitle && <Text numberOfLines={2} style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <ChevronRight size={19} color="#94A3B8" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 72,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: '#0D1B2D',
    borderWidth: 1,
    borderColor: '#1B2B40',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 10,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  title: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
});
