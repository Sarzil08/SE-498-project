import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  message?: string;
  icon?: React.ReactNode;
};

export default function EmptyState({ title, message, icon }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 170,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#0D1B2D',
    borderWidth: 1,
    borderColor: '#1B2B40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#17263A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
  },
});
