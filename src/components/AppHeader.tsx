import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertOctagon, ArrowLeft, Bell, CheckCircle2, Crown } from 'lucide-react-native';
import RoleBadge, { AppRole, ROLE_MAP } from './RoleBadge';
import { useLanguage } from '../context/LanguageContext';

type Props = {
  name: string;
  email?: string;
  role?: AppRole;
  avatarText?: string;
  notificationCount?: number;
  navigation?: any;
  onBack?: () => void;
  onProfile?: () => void;
  onNotification?: () => void;
  onSOS?: () => void;
  onSubscription?: () => void;
  showSOS?: boolean;
  showSubscription?: boolean;
  showRoleBadge?: boolean;
};

export default function AppHeader({
  name,
  email,
  role,
  avatarText,
  notificationCount = 0,
  navigation,
  onBack,
  onProfile,
  onNotification,
  onSOS,
  onSubscription,
  showSOS = false,
  showSubscription = false,
  showRoleBadge = false,
}: Props) {
  const { language } = useLanguage();
  const accent = role ? ROLE_MAP[role].color : '#38BDF8';

  const notificationAction =
    onNotification || (() => navigation?.navigate('NotificationScreen', { role }));

  const sosAction = onSOS || (() => {
    if (!navigation) return;
    navigation.navigate('OfflineAssistance', { role });
  });

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.82}>
            <ArrowLeft size={21} color="#F8FAFC" />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          disabled={!onProfile}
          onPress={onProfile}
          style={styles.profileButton}
          activeOpacity={0.82}
        >
          <View style={[styles.avatar, { backgroundColor: `${accent}22`, borderColor: accent }]}>
            <Text style={[styles.avatarText, { color: accent }]}>
              {(avatarText || name?.charAt(0) || 'U').toUpperCase()}
            </Text>
            {role && (
              <View style={[styles.verified, { backgroundColor: accent }]}>
                <CheckCircle2 size={11} color="#FFFFFF" />
              </View>
            )}
          </View>
          <View style={styles.identity}>
            <Text numberOfLines={1} style={styles.name}>{name || 'User'}</Text>
            {showRoleBadge && role ? (
              <RoleBadge role={role} compact />
            ) : (
              <Text numberOfLines={1} style={styles.email}>{email || ''}</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        {showSubscription && (
          <TouchableOpacity
            onPress={onSubscription}
            style={styles.subscriptionButton}
            activeOpacity={0.82}
            accessibilityLabel="Subscription"
          >
            <Crown size={17} color="#FFD166" />
            <Text style={styles.subscriptionText}>PRO</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={notificationAction}
          style={styles.actionButton}
          activeOpacity={0.82}
          accessibilityLabel={language === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
        >
          <Bell size={19} color="#F8FAFC" />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {showSOS && (
          <TouchableOpacity onPress={sosAction} style={styles.sosButton} activeOpacity={0.82} accessibilityLabel="Emergency SOS">
            <AlertOctagon size={18} color="#FFFFFF" />
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 76, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 12, backgroundColor: '#06111F', borderBottomWidth: 1, borderBottomColor: '#17263A', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, minWidth: 0 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#0D1B2D', alignItems: 'center', justifyContent: 'center' },
  profileButton: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarText: { fontSize: 16, fontWeight: '900' },
  verified: { position: 'absolute', right: -4, bottom: -2, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#06111F' },
  identity: { flex: 1, marginLeft: 10, minWidth: 0 },
  name: { color: '#F8FAFC', fontSize: 15, fontWeight: '800' },
  email: { color: '#94A3B8', fontSize: 11, marginTop: 3 },
  actions: { marginLeft: 8, flexDirection: 'row', alignItems: 'center', gap: 7 },
  actionButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#17263A', position: 'relative' },
  notificationBadge: { position: 'absolute', right: -3, top: -3, minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 4, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#06111F' },
  notificationText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  subscriptionButton: { minWidth: 50, height: 40, paddingHorizontal: 9, borderRadius: 12, backgroundColor: '#2B2208', borderWidth: 1, borderColor: '#8A6D1D', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  subscriptionText: { color: '#FFD166', fontSize: 10, fontWeight: '900' },
  sosButton: { minWidth: 66, height: 40, paddingHorizontal: 10, borderRadius: 12, backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  sosText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
});
