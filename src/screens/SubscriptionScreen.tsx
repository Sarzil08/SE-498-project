import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Check, CreditCard, Crown, ShieldCheck, Smartphone, Sparkles, Zap } from 'lucide-react-native';
import { useLanguage, tr } from '../context/LanguageContext';
import { AppRole, ROLE_MAP } from '../components/RoleBadge';

const PLANS = [
  {
    id: 'regular',
    name: 'Regular',
    bn: 'রেগুলার',
    monthly: 0,
    yearly: 0,
    accent: '#64748B',
    icon: Zap,
    features: ['Pay-as-you-go rescue', 'Standard GPS tracking', 'Standard service queue'],
    featuresBn: ['Pay-as-you-go রেসকিউ', 'স্ট্যান্ডার্ড GPS ট্র্যাকিং', 'স্ট্যান্ডার্ড সার্ভিস কিউ'],
  },
  {
    id: 'gold',
    name: 'Gold Member',
    bn: 'গোল্ড মেম্বার',
    monthly: 199,
    yearly: 1910,
    accent: '#F59E0B',
    icon: Sparkles,
    popular: true,
    features: ['Priority rescue queue', 'Free visit fee', 'Up to 5 km towing support'],
    featuresBn: ['হাই-প্রায়োরিটি রেসকিউ কিউ', 'ভিজিটিং ফি ফ্রি', '৫ কিমি পর্যন্ত টোয়িং সাপোর্ট'],
  },
  {
    id: 'platinum',
    name: 'Platinum Roadside King',
    bn: 'প্ল্যাটিনাম রোডসাইড কিং',
    monthly: 499,
    yearly: 4790,
    accent: '#F97316',
    icon: Crown,
    features: ['Highway rescue coverage', 'Free visit fee', 'Up to 15 km towing support'],
    featuresBn: ['হাইওয়ে রেসকিউ কভারেজ', 'ভিজিটিং ফি ফ্রি', '১৫ কিমি পর্যন্ত টোয়িং সাপোর্ট'],
  },
];

type Props = { route?: any; navigation: any };

export default function SubscriptionScreen({ route, navigation }: Props) {
  const { language } = useLanguage();
  const role: AppRole = route?.params?.role || 'customer';
  const userId = route?.params?.userId || `${role}-demo`;
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedId, setSelectedId] = useState('gold');
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'card'>('bkash');
  const [number, setNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'method' | 'verify' | 'success'>('method');
  const [loading, setLoading] = useState(false);
  const selectedPlan = useMemo(() => PLANS.find(p => p.id === selectedId) || PLANS[1], [selectedId]);
  const price = cycle === 'monthly' ? selectedPlan.monthly : selectedPlan.yearly;

  const choosePlan = (id: string) => {
    setSelectedId(id);
    const plan = PLANS.find(p => p.id === id)!;
    if (plan.monthly === 0) {
      activatePlan(plan.name, 0);
      return;
    }
    setStep('method');
    setPaymentVisible(true);
  };

  const activatePlan = async (planName: string, amount: number) => {
    const record = { planId: selectedId, planName, cycle, amount, activatedAt: new Date().toISOString() };
    try {
      await AsyncStorage.setItem(`car_rescue_subscription_${userId}`, JSON.stringify(record));
    } catch (error) {
      console.log('Subscription local save failed:', error);
    }
    Alert.alert(
      tr(language, 'Subscription active', 'সাবস্ক্রিপশন সক্রিয়'),
      tr(language, `${planName} is now active on this device.`, `${planName} এই ডিভাইসে সক্রিয় হয়েছে।`),
    );
  };

  const continuePayment = () => {
    if (!number.trim()) {
      Alert.alert(tr(language, 'Number required', 'নম্বর প্রয়োজন'), tr(language, 'Enter your wallet/card number.', 'Wallet/card নম্বর দিন।'));
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('verify');
    }, 700);
  };

  const verifyPayment = async () => {
    if (otp.trim().length < 4) {
      Alert.alert(tr(language, 'OTP required', 'OTP প্রয়োজন'), tr(language, 'Enter the demo OTP to continue.', 'চালিয়ে যেতে demo OTP দিন।'));
      return;
    }
    setLoading(true);
    setTimeout(async () => {
      setLoading(false);
      setStep('success');
      await activatePlan(selectedPlan.name, price);
    }, 700);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color="#E2E8F0" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{tr(language, 'Subscription', 'সাবস্ক্রিপশন')}</Text>
          <Text style={styles.headerSub}>{ROLE_MAP[role].label}</Text>
        </View>
        <View style={styles.proBadge}><Crown size={14} color="#06111F" /><Text style={styles.proText}>PRO</Text></View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Crown size={25} color="#F59E0B" /></View>
          <Text style={styles.heroTitle}>{tr(language, 'Choose your rescue plan', 'আপনার রেসকিউ প্ল্যান বেছে নিন')}</Text>
          <Text style={styles.heroSub}>{tr(language, 'One screen for plans, billing cycle and payment.', 'এক স্ক্রিনেই প্ল্যান, বিলিং সাইকেল ও পেমেন্ট।')}</Text>
        </View>

        <View style={styles.cycleBox}>
          <TouchableOpacity style={[styles.cycleBtn, cycle === 'monthly' && styles.cycleActive]} onPress={() => setCycle('monthly')}>
            <Text style={[styles.cycleText, cycle === 'monthly' && styles.cycleTextActive]}>{tr(language, 'Monthly', 'মাসিক')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cycleBtn, cycle === 'yearly' && styles.cycleActive]} onPress={() => setCycle('yearly')}>
            <Text style={[styles.cycleText, cycle === 'yearly' && styles.cycleTextActive]}>{tr(language, 'Yearly', 'বার্ষিক')}</Text>
            <Text style={styles.saveBadge}>-20%</Text>
          </TouchableOpacity>
        </View>

        {PLANS.map(plan => {
          const Icon = plan.icon;
          const active = selectedId === plan.id;
          const planPrice = cycle === 'monthly' ? plan.monthly : plan.yearly;
          const features = language === 'bn' ? plan.featuresBn : plan.features;
          return (
            <View key={plan.id} style={[styles.planCard, { borderColor: active ? plan.accent : '#1F3550' }, active && { backgroundColor: '#0F2032' }]}>
              {plan.popular && <View style={[styles.popular, { backgroundColor: plan.accent }]}><Text style={styles.popularText}>{tr(language, 'MOST POPULAR', 'সবচেয়ে জনপ্রিয়')}</Text></View>}
              <View style={styles.planTop}>
                <View style={[styles.planIcon, { backgroundColor: `${plan.accent}1C` }]}><Icon size={20} color={plan.accent} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{language === 'bn' ? plan.bn : plan.name}</Text>
                  <Text style={styles.planEnglish}>{plan.name}</Text>
                </View>
                <View style={styles.priceWrap}>
                  <Text style={[styles.price, { color: plan.accent }]}>৳{planPrice.toLocaleString()}</Text>
                  <Text style={styles.priceUnit}>{cycle === 'monthly' ? tr(language, '/month', '/মাস') : tr(language, '/year', '/বছর')}</Text>
                </View>
              </View>
              <View style={styles.featureList}>
                {features.map(f => <View key={f} style={styles.featureRow}><Check size={14} color="#16C784" /><Text style={styles.featureText}>{f}</Text></View>)}
              </View>
              <TouchableOpacity style={[styles.selectButton, { backgroundColor: active ? plan.accent : '#17263A' }]} onPress={() => choosePlan(plan.id)}>
                <Text style={[styles.selectText, active && { color: '#06111F' }]}>{planPrice === 0 ? tr(language, 'Use Free Plan', 'ফ্রি প্ল্যান চালু করুন') : tr(language, 'Choose Plan', 'প্ল্যান নিন')}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={styles.secureCard}><ShieldCheck size={18} color="#16C784" /><View style={{ flex: 1 }}><Text style={styles.secureTitle}>{tr(language, 'Secure payment flow', 'সুরক্ষিত পেমেন্ট ফ্লো')}</Text><Text style={styles.secureText}>{tr(language, 'bKash, Nagad and Card screens are ready for gateway integration.', 'bKash, Nagad ও Card-এর স্ক্রিন gateway integration-এর জন্য প্রস্তুত।')}</Text></View></View>
      </ScrollView>

      {paymentVisible && (
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            {step === 'method' && <>
              <Text style={styles.modalTitle}>{tr(language, 'Payment method', 'পেমেন্ট মাধ্যম')}</Text>
              <Text style={styles.modalSub}>৳{price.toLocaleString()} • {language === 'bn' ? selectedPlan.bn : selectedPlan.name}</Text>
              <View style={styles.methodRow}>
                <TouchableOpacity style={[styles.methodBtn, paymentMethod === 'bkash' && styles.methodActive]} onPress={() => setPaymentMethod('bkash')}><Smartphone size={17} color="#F59E0B" /><Text style={styles.methodText}>bKash</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.methodBtn, paymentMethod === 'nagad' && styles.methodActive]} onPress={() => setPaymentMethod('nagad')}><Smartphone size={17} color="#F97316" /><Text style={styles.methodText}>Nagad</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.methodBtn, paymentMethod === 'card' && styles.methodActive]} onPress={() => setPaymentMethod('card')}><CreditCard size={17} color="#38BDF8" /><Text style={styles.methodText}>Card</Text></TouchableOpacity>
              </View>
              <Text style={styles.inputLabel}>{paymentMethod === 'card' ? 'CARD / ACCOUNT NUMBER' : 'MOBILE WALLET NUMBER'}</Text>
              <TextInput value={number} onChangeText={setNumber} keyboardType="phone-pad" placeholder="017xxxxxxxx" placeholderTextColor="#64748B" style={styles.input} />
              <TouchableOpacity style={styles.primary} onPress={continuePayment} disabled={loading}>{loading ? <ActivityIndicator color="#06111F" /> : <Text style={styles.primaryText}>{tr(language, 'Continue', 'চালিয়ে যান')}</Text>}</TouchableOpacity>
              <TouchableOpacity onPress={() => setPaymentVisible(false)}><Text style={styles.closeText}>{tr(language, 'Cancel', 'বাতিল')}</Text></TouchableOpacity>
            </>}

            {step === 'verify' && <>
              <View style={{ alignItems: 'center' }}><Smartphone size={28} color="#38BDF8" /><Text style={styles.modalTitle}>{tr(language, 'Verify payment', 'পেমেন্ট ভেরিফাই')}</Text><Text style={styles.modalSub}>{tr(language, `Enter OTP sent to ${number}.`, `${number}-এ পাঠানো OTP দিন।`)}</Text></View>
              <TextInput value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} placeholder="123456" placeholderTextColor="#64748B" style={[styles.input, { textAlign: 'center', letterSpacing: 4 }]} />
              <TouchableOpacity style={styles.primary} onPress={verifyPayment} disabled={loading}>{loading ? <ActivityIndicator color="#06111F" /> : <Text style={styles.primaryText}>{tr(language, 'Verify & Activate', 'ভেরিফাই করে চালু করুন')}</Text>}</TouchableOpacity>
            </>}

            {step === 'success' && <>
              <View style={styles.success}><Check size={32} color="#16C784" /></View><Text style={styles.modalTitle}>{tr(language, 'Subscription activated', 'সাবস্ক্রিপশন চালু হয়েছে')}</Text><Text style={styles.modalSub}>৳{price.toLocaleString()} • {selectedPlan.name} • {cycle}</Text><TouchableOpacity style={styles.primary} onPress={() => { setPaymentVisible(false); setStep('method'); navigation.goBack(); }}><Text style={styles.primaryText}>{tr(language, 'Done', 'সম্পন্ন')}</Text></TouchableOpacity>
            </>}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06111F' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#0B1827', borderBottomWidth: 1, borderColor: '#1B2B40' },
  iconButton: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#17263A', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '900' },
  headerSub: { color: '#64748B', fontSize: 9, marginTop: 2 },
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F59E0B', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9 },
  proText: { color: '#06111F', fontSize: 9, fontWeight: '900' },
  scroll: { padding: 16, paddingBottom: 24 },
  hero: { backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#3A2A12', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 12 },
  heroIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#2A210D', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  heroTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '900', textAlign: 'center' },
  heroSub: { color: '#94A3B8', fontSize: 10, marginTop: 4, textAlign: 'center' },
  cycleBox: { flexDirection: 'row', backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#1B2B40', borderRadius: 12, padding: 4, marginBottom: 12 },
  cycleBtn: { flex: 1, minHeight: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  cycleActive: { backgroundColor: '#F97316' },
  cycleText: { color: '#94A3B8', fontSize: 10, fontWeight: '900' },
  cycleTextActive: { color: '#FFF' },
  saveBadge: { backgroundColor: '#16C784', color: '#06111F', fontSize: 7, fontWeight: '900', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 5 },
  planCard: { backgroundColor: '#0D1B2D', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10, overflow: 'hidden' },
  popular: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, marginBottom: 8 },
  popularText: { color: '#FFF', fontSize: 7, fontWeight: '900' },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  planIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planName: { color: '#F8FAFC', fontSize: 13, fontWeight: '900' },
  planEnglish: { color: '#64748B', fontSize: 8, marginTop: 2 },
  priceWrap: { alignItems: 'flex-end' },
  price: { fontSize: 17, fontWeight: '900' },
  priceUnit: { color: '#64748B', fontSize: 8, marginTop: 2 },
  featureList: { gap: 7, marginVertical: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  featureText: { color: '#CBD5E1', fontSize: 10, flex: 1 },
  selectButton: { minHeight: 43, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  selectText: { color: '#CBD5E1', fontSize: 11, fontWeight: '900' },
  secureCard: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#092318', borderWidth: 1, borderColor: '#14532D', borderRadius: 13, padding: 11, marginTop: 2 },
  secureTitle: { color: '#F8FAFC', fontSize: 10, fontWeight: '900' },
  secureText: { color: '#94A3B8', fontSize: 8, lineHeight: 13, marginTop: 2 },
  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0B1827', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: '#24364C', padding: 16 },
  modalTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '900', textAlign: 'center', marginTop: 7 },
  modalSub: { color: '#94A3B8', fontSize: 9, textAlign: 'center', marginTop: 4, marginBottom: 12 },
  methodRow: { flexDirection: 'row', gap: 7, marginBottom: 12 },
  methodBtn: { flex: 1, minHeight: 45, borderRadius: 10, backgroundColor: '#06111F', borderWidth: 1, borderColor: '#1B2B40', alignItems: 'center', justifyContent: 'center', gap: 4 },
  methodActive: { borderColor: '#38BDF8', backgroundColor: '#0C2033' },
  methodText: { color: '#E2E8F0', fontSize: 10, fontWeight: '900' },
  inputLabel: { color: '#64748B', fontSize: 8, fontWeight: '900', marginBottom: 5 },
  input: { height: 45, borderRadius: 10, borderWidth: 1, borderColor: '#24364C', backgroundColor: '#06111F', color: '#F8FAFC', paddingHorizontal: 11, marginBottom: 10 },
  primary: { height: 46, borderRadius: 11, backgroundColor: '#38BDF8', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  primaryText: { color: '#06111F', fontSize: 11, fontWeight: '900' },
  closeText: { color: '#94A3B8', fontSize: 10, fontWeight: '900', textAlign: 'center', paddingVertical: 8 },
  success: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#0B2A1B', alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
});
