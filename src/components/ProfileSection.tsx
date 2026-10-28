import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  accentColor?: string;
};

export default function ProfileSection({
  title,
  icon,
  children,
  accentColor = '#1687FF',
}: Props) {
  return (
    <View style={[styles.card, { borderColor: accentColor }]}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: `${accentColor}22` }]}>
          {icon}
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0D1B2D',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 14,
    overflow: 'hidden',
  },
  header: {
    minHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#1B2B40',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 31,
    height: 31,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
});
