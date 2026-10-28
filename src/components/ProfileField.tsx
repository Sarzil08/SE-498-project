import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Edit3 } from 'lucide-react-native';

type Props = {
  icon?: React.ComponentType<any>;
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  editable?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad' | 'email-address';
  accentColor?: string;
};

export default function ProfileField({
  icon: Icon,
  label,
  value,
  onChangeText,
  editable = true,
  keyboardType = 'default',
  accentColor = '#1687FF',
}: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: `${accentColor}22` }]}>
        {Icon ? <Icon size={18} color={accentColor} /> : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={[styles.input, !editable && styles.disabled]}
          value={value}
          editable={editable}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholderTextColor="#64748B"
        />
      </View>

      {editable ? <Edit3 size={15} color="#94A3B8" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1B2B40',
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 2,
  },
  input: {
    minHeight: 25,
    padding: 0,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  disabled: {
    color: '#64748B',
  },
});
