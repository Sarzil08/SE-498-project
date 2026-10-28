import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function LoadingState({
  label = 'Loading...',
  color = '#1687FF',
}: {
  label?: string;
  color?: string;
}) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={color} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 10,
  },
});
