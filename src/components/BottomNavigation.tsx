import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock3, Home, Settings, ShoppingBag, Wrench } from 'lucide-react-native';
import { AppRole } from './RoleBadge';
import { useLanguage } from '../context/LanguageContext';

type TabKey = 'Home' | 'Service' | 'Store' | 'History' | 'Settings';

type Props = {
  activeTab: TabKey | null;
  role: AppRole;
  navigation: any;
  accentColor?: string;
};

const dashboardRoute: Record<AppRole, string> = {
  customer: 'CustomerDashboard',
  mechanic: 'MechanicDashboard',
  b2b: 'B2BDashboard',
  driver: 'DriverDashboard',
};

const TABS = [
  { key: 'Home' as const, en: 'Map', bn: 'ম্যাপ', Icon: Home },
  { key: 'Service' as const, en: 'Service', bn: 'সার্ভিস', Icon: Wrench },
  { key: 'Store' as const, en: 'Store', bn: 'স্টোর', Icon: ShoppingBag },
  { key: 'History' as const, en: 'History', bn: 'ইতিহাস', Icon: Clock3 },
  { key: 'Settings' as const, en: 'Settings', bn: 'সেটিংস', Icon: Settings },
];

export default function BottomNavigation({ activeTab, role, navigation, accentColor = '#1687FF' }: Props) {
  const { language } = useLanguage();

  const handlePress = (tab: TabKey) => {
    if (tab === activeTab) return;
    if (tab === 'Home') {
      navigation.navigate(dashboardRoute[role], { focus: 'home' });
      return;
    }
    if (tab === 'Service') {
      navigation.navigate('ServiceScreen', { role });
      return;
    }
    if (tab === 'Store') {
      navigation.navigate('StoreScreen', { role });
      return;
    }
    if (tab === 'History') {
      navigation.navigate('ServiceHistory', { role });
      return;
    }
    navigation.navigate('SettingsScreen', { role });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        {TABS.map(({ key, en, bn, Icon }) => {
        const active = key === activeTab;
        return (
          <TouchableOpacity key={key} style={styles.tab} activeOpacity={0.82} onPress={() => handlePress(key)}>
            <View style={[styles.iconWrap, active && { backgroundColor: `${accentColor}22` }]}>
              <Icon size={20} color={active ? accentColor : '#94A3B8'} />
            </View>
            <Text style={[styles.label, { color: active ? accentColor : '#94A3B8' }]}>{language === 'bn' ? bn : en}</Text>
          </TouchableOpacity>
        );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#06111F' },
  container: { minHeight: 72, paddingHorizontal: 5, paddingTop: 8, paddingBottom: 8, backgroundColor: '#06111F', borderTopWidth: 1, borderTopColor: '#17263A', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  iconWrap: { width: 33, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 9.5, fontWeight: '800' },
});
