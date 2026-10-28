import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, CheckCircle2 } from 'lucide-react-native';
import RoleBadge, { AppRole, ROLE_MAP } from './RoleBadge';

type Props = {
  name: string;
  role: AppRole;
  subtitle?: string;
  avatarText?: string;
  onAvatarPress?: () => void;
};

export default function ProfileHeader({
  name,
  role,
  subtitle,
  avatarText,
  onAvatarPress,
}: Props) {
  const color = ROLE_MAP[role].color;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onAvatarPress}
        disabled={!onAvatarPress}
        activeOpacity={0.8}
      >
        <View style={[styles.avatar, { borderColor: color }]}>
          <Text style={[styles.avatarText, { color }]}>
            {(avatarText || name?.charAt(0) || 'U').toUpperCase()}
          </Text>

          {onAvatarPress ? (
            <View style={[styles.camera, { backgroundColor: color }]}>
              <Camera size={13} color="#FFF" />
            </View>
          ) : null}

          <View style={[styles.verified, { backgroundColor: color }]}>
            <CheckCircle2 size={13} color="#FFF" />
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={styles.name}>
            {name || 'Your Name'}
          </Text>
        </View>
        <Text style={styles.subtitle}>{subtitle || ''}</Text>
        <View style={styles.badgeRow}>
          <RoleBadge role={role} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 3,
    backgroundColor: '#0D1B2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 25,
    fontWeight: '900',
  },
  verified: {
    position: 'absolute',
    right: -1,
    bottom: 1,
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: '#06111F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#06111F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 15,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 3,
  },
  badgeRow: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
});
