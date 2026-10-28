import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Bell,
  Building2,
  Car,
  ChevronRight,
  Cpu,
  Languages,
  LogOut,
  MapPin,
  PhoneCall,
  ShieldCheck,
  User,
  Wrench,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader, BottomNavigation, QuickActionCard, StatusBadge } from '../components';
import { AppRole, ROLE_MAP } from '../components/RoleBadge';
import { supabase } from '../supabaseClient';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { useLanguage, tr } from '../context/LanguageContext';
import {
  AccidentSettings,
  DEFAULT_ACCIDENT_SETTINGS,
  loadAccidentSettings,
  saveAccidentSettings,
} from '../services/accidentSettingsStore';
import { startAccidentMonitoring } from '../services/AccidentEmergencyService';

export default function SettingsScreen({ route, navigation }: any) {
  const { language, setLanguage } = useLanguage();
  const [role, setRole] = useState<AppRole>(route?.params?.role || 'customer');
  const [accountId, setAccountId] = useState<string>(route?.params?.userId || 'demo');
  const [trackingMode, setTrackingMode] = useState<'hardware' | 'phone'>('hardware');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emergencyPhone, setEmergencyPhone] = useState('018XXXXXXXX');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [tempPhone, setTempPhone] = useState(emergencyPhone);
  const [fullName, setFullName] = useState('User');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [deviceId] = useState('ESP32_CAR_001');
  const [accidentSettings, setAccidentSettings] = useState<AccidentSettings>({ ...DEFAULT_ACCIDENT_SETTINGS });
  const [accidentSaving, setAccidentSaving] = useState(false);
  const unread = useUnreadNotifications(role);
  const accent = ROLE_MAP[role].color;
  const showAccident = role === 'customer' || role === 'driver';

  useEffect(() => {
    loadRoleAndUser();
  }, [route?.params?.role, route?.params?.userId]);

  useEffect(() => {
    if (!showAccident) return;
    try {
      setAccidentSettings(loadAccidentSettings(role as 'customer' | 'driver', accountId));
    } catch (error) {
      console.log('Accident settings load:', error);
    }
  }, [role, accountId, showAccident]);

  async function loadRoleAndUser() {
    try {
      const routeRole = route?.params?.role as AppRole | undefined;
      const routeUserId = route?.params?.userId as string | undefined;
      if (routeRole && ROLE_MAP[routeRole]) setRole(routeRole);
      if (routeUserId) setAccountId(routeUserId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setAccountId(routeUserId || user.id);
      setEmail(user.email || '');

      const { data } = await supabase
        .from('profiles')
        .select('full_name, role, mobile_number')
        .eq('id', user.id)
        .maybeSingle();

      if (data?.full_name) setFullName(data.full_name);
      if (data?.mobile_number) {
        setMobileNumber(data.mobile_number);
        setAccidentSettings(prev => ({
          ...prev,
          contactPhone: prev.contactPhone || data.mobile_number,
        }));
      }
      if (!routeRole && data?.role && ROLE_MAP[data.role as AppRole]) setRole(data.role as AppRole);
    } catch (e) {
      console.log('Settings user load:', e);
    }
  }

  const handleLogout = () => {
    Alert.alert(
      tr(language, 'Logout', 'লগআউট'),
      tr(language, 'Are you sure you want to log out?', 'আপনি কি লগআউট করতে চান?'),
      [
        { text: tr(language, 'Cancel', 'বাতিল'), style: 'cancel' },
        {
          text: tr(language, 'Logout', 'লগআউট'),
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            navigation.reset({ index: 0, routes: [{ name: 'AuthScreen' }] });
          },
        },
      ],
    );
  };

  const savePhone = () => {
    setEmergencyPhone(tempPhone.trim());
    setIsEditingPhone(false);
    Alert.alert(tr(language, 'Success', 'সফল'), tr(language, 'Emergency contact updated.', 'ইমার্জেন্সি কন্টাক্ট আপডেট হয়েছে।'));
  };

  const updateAccident = <K extends keyof AccidentSettings>(key: K, value: AccidentSettings[K]) => {
    setAccidentSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveAccident = async () => {
    const cleaned = {
      ...accidentSettings,
      contactPhone: accidentSettings.contactPhone.trim(),
      emergencyPhone: accidentSettings.emergencyPhone.trim(),
      ownerPhone: accidentSettings.ownerPhone.trim(),
    };

    if (cleaned.sendEmergencyContact && !cleaned.emergencyPhone) {
      Alert.alert(
        tr(language, 'Emergency number required', 'ইমার্জেন্সি নম্বর প্রয়োজন'),
        tr(language, 'Enter an emergency contact or turn off the Emergency Contact SMS option.', 'ইমার্জেন্সি কন্টাক্ট দিন অথবা Emergency Contact SMS option বন্ধ করুন।'),
      );
      return;
    }

    if (role === 'driver' && cleaned.sendOwner && !cleaned.ownerPhone) {
      Alert.alert(
        tr(language, 'Vehicle owner number required', 'গাড়ির মালিকের নম্বর প্রয়োজন'),
        tr(language, 'Enter the vehicle owner/B2B owner number or turn off Vehicle Owner SMS.', 'গাড়ির মালিক/B2B owner-এর নম্বর দিন অথবা Vehicle Owner SMS বন্ধ করুন।'),
      );
      return;
    }

    setAccidentSaving(true);
    try {
      saveAccidentSettings(role as 'customer' | 'driver', accountId, cleaned);
      setAccidentSettings(cleaned);
      Alert.alert(
        tr(language, 'Saved', 'সেভ হয়েছে'),
        tr(language, 'Accident SMS settings updated.', 'Accident SMS settings আপডেট হয়েছে।'),
      );
    } catch (error: any) {
      Alert.alert(tr(language, 'Save failed', 'সেভ ব্যর্থ'), error?.message || 'Could not save accident settings.');
    } finally {
      setAccidentSaving(false);
    }
  };

  const handleAccidentTest = async () => {
    await startAccidentMonitoring(
      {
        role: role as 'customer' | 'driver',
        userId: accountId,
        personName: fullName,
        contactPhone: accidentSettings.contactPhone || mobileNumber,
        vehicleInfo: role === 'driver' ? 'Delivery Truck X-12' : 'Toyota Axio',
        vehicleId: accountId,
        latitude: 23.8103,
        longitude: 90.4125,
        moving: false,
        testOnly: true,
      },
      status => {
        if (status.type === 'test-complete' || status.type === 'cancelled' || status.type === 'failed') {
          Alert.alert(
            tr(language, 'Accident test', 'Accident test'),
            status.message,
          );
        }
      },
    );
  };

  const roleTitle = { customer: 'Customer', mechanic: 'Mechanic', b2b: 'B2B', driver: 'Driver' }[role];
  const roleBn = { customer: 'কাস্টমার', mechanic: 'মেকানিক', b2b: 'বিজনেস', driver: 'ড্রাইভার' }[role];

  const roleItems = {
    customer: {
      title: tr(language, 'Customer Preferences', 'কাস্টমার সেটিংস'),
      items: language === 'bn' ? ['গাড়ির হেলথ alert', 'মেকানিক request update', 'Subscription reminder'] : ['Vehicle health alerts', 'Mechanic request updates', 'Subscription reminders'],
    },
    mechanic: {
      title: tr(language, 'Mechanic Preferences', 'মেকানিক সেটিংস'),
      items: language === 'bn' ? ['নতুন কাজের request alert', 'Store order alert', 'অনলাইন/অফলাইন reminder'] : ['New job request alerts', 'Store order alerts', 'Online/offline reminders'],
    },
    b2b: {
      title: tr(language, 'Fleet Preferences', 'ফ্লিট সেটিংস'),
      items: language === 'bn' ? ['ফ্লিট health alert', 'ড্রাইভার safety alert', 'Maintenance reminder'] : ['Fleet health alerts', 'Driver safety alerts', 'Maintenance reminders'],
    },
    driver: {
      title: tr(language, 'Driver Preferences', 'ড্রাইভার সেটিংস'),
      items: language === 'bn' ? ['ডিউটি status alert', 'Assigned vehicle alert', 'Offline assistance reminder'] : ['Duty status alerts', 'Assigned vehicle alerts', 'Offline assistance reminders'],
    },
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader
        name={tr(language, 'Settings', 'সেটিংস')}
        email={`${roleTitle} • ${fullName}`}
        role={role}
        navigation={navigation}
        notificationCount={unread}
        onBack={() => navigation.goBack()}
        onNotification={() => navigation.navigate('NotificationScreen', { role })}
        showSOS={false}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.roleBanner, { borderColor: accent }]}>
          <View style={[styles.roleIcon, { backgroundColor: `${accent}18` }]}>
            {role === 'customer' && <User size={20} color={accent} />}
            {role === 'mechanic' && <Wrench size={20} color={accent} />}
            {role === 'b2b' && <Building2 size={20} color={accent} />}
            {role === 'driver' && <Car size={20} color={accent} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>{language === 'bn' ? `${roleBn} সেটিংস` : `${roleTitle} Settings`}</Text>
            <Text style={styles.bannerSub}>{tr(language, 'Options are tailored to this account type.', 'এই অ্যাকাউন্টের role অনুযায়ী options দেখানো হচ্ছে।')}</Text>
          </View>
          <StatusBadge text={tr(language, 'Active', 'সক্রিয়')} type="success" />
        </View>

        <Text style={styles.sectionTitle}>{tr(language, 'Account', 'অ্যাকাউন্ট')}</Text>
        <QuickActionCard title={tr(language, 'My Profile', 'আমার প্রোফাইল')} subtitle={tr(language, 'View and edit role-specific profile', 'আপনার role অনুযায়ী profile দেখুন ও edit করুন')} icon={<User size={19} color={accent} />} accentColor={accent} onPress={() => navigation.navigate('ProfileScreen', { role })} />
        <QuickActionCard title={tr(language, 'Notifications', 'নোটিফিকেশন')} subtitle={tr(language, `${unread} unread notification${unread === 1 ? '' : 's'}`, `${unread}টি unread notification`)} icon={<Bell size={19} color={accent} />} accentColor={accent} onPress={() => navigation.navigate('NotificationScreen', { role })} />

        <Text style={styles.sectionTitle}>{tr(language, 'Language', 'ভাষা')}</Text>
        <View style={styles.languageCard}>
          <View style={[styles.languageIcon, { backgroundColor: `${accent}18` }]}><Languages size={18} color={accent} /></View>
          <View style={styles.languageTextWrap}>
            <Text style={styles.cardTitle}>{tr(language, 'App Language', 'অ্যাপের ভাষা')}</Text>
            <Text style={styles.subText}>{tr(language, 'Choose Bangla or English for shared app controls.', 'অ্যাপের shared controls-এর জন্য বাংলা বা English বেছে নিন।')}</Text>
          </View>
          <View style={styles.languageToggle}>
            <TouchableOpacity onPress={() => setLanguage('bn')} style={[styles.langButton, language === 'bn' && { backgroundColor: accent, borderColor: accent }]}><Text style={[styles.langText, language === 'bn' && styles.langTextActive]}>বাংলা</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setLanguage('en')} style={[styles.langButton, language === 'en' && { backgroundColor: accent, borderColor: accent }]}><Text style={[styles.langText, language === 'en' && styles.langTextActive]}>English</Text></TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{tr(language, 'Preferences', 'পছন্দ')}</Text>
        <View style={styles.card}>
          <View style={styles.cardHeading}><MapPin size={17} color={accent} /><Text style={styles.cardTitle}>{tr(language, 'Location Tracking Mode', 'লোকেশন ট্র্যাকিং মোড')}</Text></View>
          <Text style={styles.subText}>{role === 'driver' ? tr(language, 'Choose the source used for live duty tracking.', 'লাইভ duty tracking-এর source বেছে নিন।') : tr(language, 'Choose the preferred location source for assistance.', 'assistance-এর জন্য location source বেছে নিন।')}</Text>
          <View style={styles.modeRow}>
            {(['hardware', 'phone'] as const).map(mode => (
              <TouchableOpacity key={mode} style={[styles.modeButton, trackingMode === mode && { backgroundColor: `${accent}20`, borderColor: accent }]} onPress={() => setTrackingMode(mode)}><Text style={[styles.modeText, trackingMode === mode && { color: accent }]}>{mode === 'hardware' ? tr(language, 'Hardware GPS', 'হার্ডওয়্যার GPS') : tr(language, 'Phone GPS', 'ফোন GPS')}</Text></TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}><View style={styles.inlineTitle}><Bell size={17} color={accent} /><Text style={styles.cardTitle}>{tr(language, 'Push Notifications', 'Push Notification')}</Text></View><Text style={styles.subText}>{tr(language, 'Service, payment and Store alerts', 'সার্ভিস, পেমেন্ট ও Store alert')}</Text></View>
          <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: '#334155', true: accent }} thumbColor="#F8FAFC" />
        </View>

        {showAccident && (
          <>
            <Text style={styles.sectionTitle}>{tr(language, 'Accident Emergency', 'অ্যাক্সিডেন্ট ইমার্জেন্সি')}</Text>
            <View style={[styles.card, styles.accidentCard]}>
              <View style={styles.cardHeading}><ShieldCheck size={18} color="#EF4444" /><Text style={styles.cardTitle}>{tr(language, 'Automatic Accident SMS', 'অটোমেটিক অ্যাক্সিডেন্ট SMS')}</Text></View>
              <Text style={styles.subText}>
                {tr(language, 'Accident signal → 20-second no-movement check → SMS only when movement is not detected.', 'Accident signal → ২০ সেকেন্ড movement check → movement না থাকলেই SMS যাবে।')}
              </Text>

              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}><Text style={styles.settingTitle}>{tr(language, 'Accident Alert', 'অ্যাক্সিডেন্ট Alert')}</Text><Text style={styles.settingSub}>{accidentSettings.enabled ? tr(language, 'Automatic emergency alert is active.', 'অটোমেটিক ইমার্জেন্সি alert চালু।') : tr(language, 'Automatic emergency alert is off.', 'অটোমেটিক ইমার্জেন্সি alert বন্ধ।')}</Text></View>
                <Switch value={accidentSettings.enabled} onValueChange={v => updateAccident('enabled', v)} trackColor={{ false: '#334155', true: '#EF4444' }} thumbColor="#F8FAFC" />
              </View>

              <Text style={styles.inputLabel}>{tr(language, 'Your contact number', 'আপনার কন্টাক্ট নম্বর')}</Text>
              <TextInput value={accidentSettings.contactPhone || mobileNumber} onChangeText={v => updateAccident('contactPhone', v)} style={styles.input} keyboardType="phone-pad" placeholder="01XXXXXXXXX" placeholderTextColor="#64748B" />

              <Text style={styles.inputLabel}>{tr(language, 'Emergency contact number', 'ইমার্জেন্সি কন্টাক্ট নম্বর')}</Text>
              <TextInput value={accidentSettings.emergencyPhone} onChangeText={v => updateAccident('emergencyPhone', v)} style={styles.input} keyboardType="phone-pad" placeholder="01XXXXXXXXX" placeholderTextColor="#64748B" />

              {role === 'driver' && (
                <>
                  <Text style={styles.inputLabel}>{tr(language, 'Vehicle owner / B2B owner number', 'গাড়ির মালিক / B2B owner নম্বর')}</Text>
                  <TextInput value={accidentSettings.ownerPhone} onChangeText={v => updateAccident('ownerPhone', v)} style={styles.input} keyboardType="phone-pad" placeholder="01XXXXXXXXX" placeholderTextColor="#64748B" />
                </>
              )}

              {role === 'customer' && (
                <>
                  <Text style={styles.inputLabel}>{tr(language, 'Vehicle owner number (optional)', 'গাড়ির মালিকের নম্বর (optional)')}</Text>
                  <TextInput value={accidentSettings.ownerPhone} onChangeText={v => updateAccident('ownerPhone', v)} style={styles.input} keyboardType="phone-pad" placeholder="01XXXXXXXXX" placeholderTextColor="#64748B" />
                </>
              )}

              <View style={styles.settingRow}><View style={{ flex: 1 }}><Text style={styles.settingTitle}>{tr(language, 'Send SMS to Emergency Contact', 'Emergency Contact-এ SMS')}</Text><Text style={styles.settingSub}>{tr(language, 'Send the accident message to the saved emergency number.', 'সেভ করা emergency number-এ accident SMS যাবে।')}</Text></View><Switch value={accidentSettings.sendEmergencyContact} onValueChange={v => updateAccident('sendEmergencyContact', v)} trackColor={{ false: '#334155', true: accent }} thumbColor="#F8FAFC" /></View>

              <View style={styles.settingRow}><View style={{ flex: 1 }}><Text style={styles.settingTitle}>{tr(language, 'Send SMS to Nearby Mechanics', 'কাছের মেকানিকদের SMS')}</Text><Text style={styles.settingSub}>{tr(language, 'Send to nearby mechanic profiles within the alert radius.', 'alert radius-এর মধ্যে nearby mechanic profile-এ SMS যাবে।')}</Text></View><Switch value={accidentSettings.sendNearbyMechanics} onValueChange={v => updateAccident('sendNearbyMechanics', v)} trackColor={{ false: '#334155', true: accent }} thumbColor="#F8FAFC" /></View>

              <View style={styles.settingRow}><View style={{ flex: 1 }}><Text style={styles.settingTitle}>{tr(language, 'Send SMS to Vehicle Owner', 'গাড়ির মালিককে SMS')}</Text><Text style={styles.settingSub}>{tr(language, 'Use the saved vehicle-owner/B2B owner number.', 'সেভ করা vehicle owner/B2B owner নম্বরে SMS যাবে।')}</Text></View><Switch value={accidentSettings.sendOwner} onValueChange={v => updateAccident('sendOwner', v)} trackColor={{ false: '#334155', true: accent }} thumbColor="#F8FAFC" /></View>

              <View style={styles.testInfo}><Text style={styles.testInfoText}>{tr(language, 'Safety window: 20 seconds • movement threshold: 15 meters.', 'Safety window: ২০ সেকেন্ড • movement threshold: ১৫ মিটার।')}</Text><Text style={styles.testInfoText}>{tr(language, 'The SMS includes your contact number, vehicle info and current map location.', 'SMS-এ আপনার contact number, vehicle info এবং current map location থাকবে।')}</Text></View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.saveAccidentBtn, { backgroundColor: accent }]} onPress={handleSaveAccident} disabled={accidentSaving}><Text style={styles.saveAccidentText}>{accidentSaving ? tr(language, 'Saving...', 'সেভ হচ্ছে...') : tr(language, 'Save accident settings', 'Accident settings সেভ করুন')}</Text></TouchableOpacity>
                <TouchableOpacity style={styles.testBtn} onPress={handleAccidentTest} disabled={accidentSaving}><Text style={styles.testBtnText}>{tr(language, 'Test 20 sec', '২০ সেকেন্ড Test')}</Text></TouchableOpacity>
              </View>
              <Text style={styles.testCaption}>{tr(language, 'Test mode never sends SMS.', 'Test mode কখনো SMS পাঠায় না।')}</Text>
            </View>
          </>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeading}>{role === 'b2b' ? <Building2 size={17} color={accent} /> : role === 'mechanic' ? <Wrench size={17} color={accent} /> : <Car size={17} color={accent} />}<Text style={styles.cardTitle}>{roleItems[role].title}</Text></View>
          {roleItems[role].items.map(item => <View key={item} style={styles.bulletRow}><View style={[styles.bullet, { backgroundColor: accent }]} /><Text style={styles.bulletText}>{item}</Text></View>)}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeading}><PhoneCall size={17} color="#EF4444" /><Text style={styles.cardTitle}>{tr(language, 'Emergency SOS Contact', 'ইমার্জেন্সি SOS কন্টাক্ট')}</Text></View>
          {isEditingPhone ? (
            <View style={styles.phoneEdit}><TextInput value={tempPhone} onChangeText={setTempPhone} style={styles.input} keyboardType="phone-pad"/><TouchableOpacity style={[styles.savePhone, { backgroundColor: accent }]} onPress={savePhone}><Text style={styles.savePhoneText}>{tr(language, 'Save', 'সেভ')}</Text></TouchableOpacity></View>
          ) : (
            <View style={styles.phoneRow}><Text style={styles.phoneValue}>{emergencyPhone}</Text><TouchableOpacity onPress={() => { setTempPhone(emergencyPhone); setIsEditingPhone(true); }}><Text style={[styles.link, { color: accent }]}>{tr(language, 'Change', 'পরিবর্তন')}</Text></TouchableOpacity></View>
          )}
        </View>

        {showAccident && <View style={styles.card}><View style={styles.cardHeading}><Cpu size={17} color={accent} /><Text style={styles.cardTitle}>{tr(language, 'Linked Hardware', 'সংযুক্ত হার্ডওয়্যার')}</Text></View><Text style={styles.label}>{tr(language, 'Device ID', 'ডিভাইস ID')}</Text><Text style={styles.value}>{deviceId}</Text><View style={{ marginTop: 10 }}><StatusBadge text={tr(language, 'Online & Connected', 'অনলাইন ও সংযুক্ত')} type="success" /></View></View>}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}><LogOut size={17} color="#EF4444" /><Text style={styles.logoutText}>{tr(language, 'Log Out', 'লগআউট')}</Text><ChevronRight size={16} color="#EF4444" /></TouchableOpacity>
      </ScrollView>

      <BottomNavigation activeTab="Settings" role={role} navigation={navigation} accentColor={accent} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06111F' },
  scroll: { padding: 16, paddingBottom: 18 },
  roleBanner: { backgroundColor: '#0D1B2D', borderWidth: 1, borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  roleIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '900' },
  bannerSub: { color: '#64748B', fontSize: 10, marginTop: 3, lineHeight: 15 },
  sectionTitle: { color: '#94A3B8', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8, marginTop: 3 },
  card: { backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#1B2B40', borderRadius: 15, padding: 14, marginBottom: 10 },
  accidentCard: { borderColor: '#4B2330' },
  cardRow: { backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#1B2B40', borderRadius: 15, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  inlineTitle: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 2 },
  cardTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '900' },
  subText: { color: '#64748B', fontSize: 10, lineHeight: 15 },
  modeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  modeButton: { flex: 1, minHeight: 42, borderRadius: 10, borderWidth: 1, borderColor: '#24364C', backgroundColor: '#06111F', alignItems: 'center', justifyContent: 'center' },
  modeText: { color: '#94A3B8', fontSize: 10, fontWeight: '800' },
  languageCard: { backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#1B2B40', borderRadius: 15, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  languageIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  languageTextWrap: { flex: 1 },
  languageToggle: { gap: 5 },
  langButton: { minWidth: 74, height: 31, borderRadius: 9, borderWidth: 1, borderColor: '#24364C', backgroundColor: '#06111F', alignItems: 'center', justifyContent: 'center' },
  langText: { color: '#94A3B8', fontSize: 10, fontWeight: '900' },
  langTextActive: { color: '#FFF' },
  bulletRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 9 },
  bullet: { width: 7, height: 7, borderRadius: 4 },
  bulletText: { color: '#CBD5E1', fontSize: 11 },
  label: { color: '#64748B', fontSize: 10, marginBottom: 4 },
  value: { color: '#F8FAFC', fontSize: 13, fontWeight: '800' },
  phoneRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phoneValue: { color: '#F8FAFC', fontSize: 14, fontWeight: '900' },
  link: { fontSize: 10, fontWeight: '900' },
  phoneEdit: { flexDirection: 'row', gap: 8 },
  input: { height: 42, backgroundColor: '#06111F', borderWidth: 1, borderColor: '#24364C', borderRadius: 10, color: '#F8FAFC', paddingHorizontal: 11, marginTop: 5, marginBottom: 8 },
  savePhone: { height: 42, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  savePhoneText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#18283B', marginTop: 8 },
  settingTitle: { color: '#F8FAFC', fontSize: 11, fontWeight: '900' },
  settingSub: { color: '#64748B', fontSize: 9, lineHeight: 14, marginTop: 2 },
  inputLabel: { color: '#94A3B8', fontSize: 9, fontWeight: '900', marginTop: 8 },
  testInfo: { backgroundColor: '#111D2C', borderWidth: 1, borderColor: '#1F3550', borderRadius: 11, padding: 10, marginTop: 4 },
  testInfoText: { color: '#94A3B8', fontSize: 9, lineHeight: 14 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  saveAccidentBtn: { flex: 1, minHeight: 43, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  saveAccidentText: { color: '#FFF', fontSize: 10, fontWeight: '900', textAlign: 'center' },
  testBtn: { minWidth: 96, minHeight: 43, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, backgroundColor: '#17263A', borderWidth: 1, borderColor: '#24364C' },
  testBtnText: { color: '#CBD5E1', fontSize: 10, fontWeight: '900' },
  testCaption: { color: '#64748B', fontSize: 8, textAlign: 'center', marginTop: 6 },
  logoutButton: { height: 50, borderRadius: 13, borderWidth: 1, borderColor: '#7F1D1D', backgroundColor: '#1D1216', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3, marginBottom: 5 },
  logoutText: { color: '#F87171', fontSize: 13, fontWeight: '900', flex: 1, textAlign: 'center' },
});
