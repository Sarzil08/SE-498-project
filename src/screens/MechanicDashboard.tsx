import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Banknote,
  CheckCircle2,
  MapPin,
  PlusCircle,
  Power,
  WalletCards,
  Wrench,
  X,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader, BottomNavigation, StatCard, StatusBadge } from '../components';
import LiveMap from '../components/LiveMap';
import { addNotification } from '../components/notificationStore';
import { addServiceHistory } from '../components/serviceHistoryStore';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import {
  getMechanicWallet,
  isMechanicBlocked,
  MECHANIC_MIN_ACTIVE_WALLET,
  rechargeMechanicWallet,
  subscribeBilling,
} from '../services/billingStore';

export default function MechanicDashboard({ route, navigation }: any) {
  const mechanicName = route?.params?.name || 'মেকানিক ড্যাশবোর্ড';
  const mechanicId = route?.params?.userId || 'mech-01';
  const notificationCount = useUnreadNotifications('mechanic');
  const [activeTab, setActiveTab] = useState<'feed' | 'active'>('feed');
  const [isOnline, setIsOnline] = useState(true);
  const [activeJob, setActiveJob] = useState<any | null>(null);
  const [extraBill, setExtraBill] = useState('');
  const [extraBillReason, setExtraBillReason] = useState('');
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [walletRechargeAmount, setWalletRechargeAmount] = useState('1000');
  const [walletBalance, setWalletBalance] = useState(1000);
  const [walletLoading, setWalletLoading] = useState(false);
  const [customerComment, setCustomerComment] = useState('');
  const [requests, setRequests] = useState([
    { id: '1', title: 'Car engine overheated & smoking', distance: '২.৪ কিমি দূরে', reward: '৳৯০০', basePrice: 900, customerLocation: { latitude: 23.82, longitude: 90.42 } },
    { id: '2', title: 'Flat Tire Replacement Needed', distance: '৪.১ কিমি দূরে', reward: '৳৪৫০', basePrice: 450, customerLocation: { latitude: 23.83, longitude: 90.43 } },
  ]);
  const mechanicLocation = { latitude: 23.8145, longitude: 90.4165 };

  const refreshWallet = async () => {
    try {
      const wallet = await getMechanicWallet(mechanicId);
      setWalletBalance(wallet.balance);
      if (wallet.blocked) setIsOnline(false);
    } catch (error) {
      console.log('Mechanic wallet refresh:', error);
    }
  };

  useEffect(() => {
    refreshWallet();
    const sub = subscribeBilling(wallet => {
      if (wallet.mechanicId === mechanicId) {
        setWalletBalance(wallet.balance);
        if (wallet.blocked) setIsOnline(false);
      }
    });
    return () => sub.remove();
  }, [mechanicId]);

  useEffect(() => {
    if (!activeJob || activeJob.paymentStatus === 'paid_online') return;
    const timer = setTimeout(() => setActiveJob((job: any) => job ? { ...job, paymentStatus: 'paid_online' } : null), 15000);
    return () => clearTimeout(timer);
  }, [activeJob]);

  const stats = useMemo(() => ({ requests: requests.length, active: activeJob ? 1 : 0, completed: 18, earnings: '৳12,400' }), [requests.length, activeJob]);
  const walletBlocked = isMechanicBlocked(walletBalance);

  const handleToggleStatus = async () => {
    if (activeJob) {
      Alert.alert('চলমান কাজ', 'চলমান কাজ থাকলে অফলাইনে যেতে পারবেন না।');
      return;
    }
    if (!isOnline) {
      const wallet = await getMechanicWallet(mechanicId);
      setWalletBalance(wallet.balance);
      if (wallet.blocked) {
        Alert.alert('Wallet blocked', `Wallet balance ৳${wallet.balance}. Online হতে wallet-এ ৳${MECHANIC_MIN_ACTIVE_WALLET + 1} এর বেশি রাখতে হবে।`, [
          { text: 'Recharge', onPress: () => setWalletModalVisible(true) },
          { text: 'Close', style: 'cancel' },
        ]);
        return;
      }
    }
    setIsOnline(v => !v);
  };

  const handleAcceptRequest = async (request: any) => {
    const wallet = await getMechanicWallet(mechanicId);
    setWalletBalance(wallet.balance);
    if (!isOnline) {
      Alert.alert('অফলাইন', 'কাজ গ্রহণ করতে আগে Online হন।');
      return;
    }
    if (wallet.blocked) {
      Alert.alert('Wallet blocked', `৳${wallet.balance} wallet balance-এর কারণে job accept করা বন্ধ। Recharge করে আবার চেষ্টা করুন।`, [
        { text: 'Recharge', onPress: () => setWalletModalVisible(true) },
        { text: 'Close', style: 'cancel' },
      ]);
      return;
    }
    setActiveJob({ ...request, paymentStatus: 'pending' });
    setRequests(prev => prev.filter(item => item.id !== request.id));
    setActiveTab('active');
    addNotification({ role: 'mechanic', title: 'Job accepted', message: `${request.title} is now your active job.`, kind: 'service' });
  };

  const handleRecharge = async () => {
    const amount = Number(walletRechargeAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Recharge amount must be greater than 0.');
      return;
    }
    setWalletLoading(true);
    try {
      const wallet = await rechargeMechanicWallet(mechanicId, amount);
      setWalletBalance(wallet.balance);
      setWalletModalVisible(false);
      Alert.alert('Wallet recharged', `Current wallet balance: ৳${wallet.balance}`);
    } catch (error: any) {
      Alert.alert('Recharge failed', error?.message || 'Could not recharge wallet.');
    } finally {
      setWalletLoading(false);
    }
  };

  const handlePushExtraBill = () => {
    if (!extraBill || !extraBillReason.trim()) {
      Alert.alert('তথ্য দিন', 'বিলের অংক এবং কারণ লিখুন।');
      return;
    }
    Alert.alert('সফল', `৳${extraBill} অতিরিক্ত বিল কাস্টমারকে পাঠানো হয়েছে।`);
    addNotification({ role: 'mechanic', title: 'Extra bill sent', message: `৳${extraBill} extra bill was sent to the customer.`, kind: 'payment' });
    setExtraBill('');
    setExtraBillReason('');
  };

  const handleCompleteJob = () => setRatingModalVisible(true);

  const handleSubmitRating = () => {
    const job = activeJob;
    if (job) {
      const fullBill = Number(job.basePrice || 0) + Number(job.extraCharges || 0);
      const estimatedCommission = Math.round(fullBill * 0.1);
      addServiceHistory({
        role: 'mechanic',
        title: job.title,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        partner: 'Customer',
        amount: `৳${Math.max(0, fullBill - estimatedCommission)}`,
        status: 'completed',
        vehicle: 'Customer Vehicle',
        location: 'Dhaka',
        rating: 5,
      });
      addNotification({ role: 'mechanic', title: 'Job completed', message: `${job.title} was added to your service history.`, kind: 'service' });
    }
    setRatingModalVisible(false);
    setCustomerComment('');
    setActiveJob(null);
    setActiveTab('feed');
    Alert.alert('ধন্যবাদ!', 'কাজ সফলভাবে সম্পন্ন হয়েছে এবং History-তে সংরক্ষণ করা হয়েছে।');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader
        name={mechanicName}
        email={isOnline ? '● Online • Mechanic' : '● Offline • Mechanic'}
        role="mechanic"
        avatarText="M"
        navigation={navigation}
        notificationCount={notificationCount}
        onProfile={() => navigation.navigate('ProfileScreen', { role: 'mechanic', userId: mechanicId })}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.statusRow}>
          <View style={{ flex: 1 }}><Text style={styles.heading}>Service Desk</Text><Text style={styles.subheading}>Accept nearby roadside assistance jobs.</Text></View>
          <TouchableOpacity style={[styles.onlineBtn, { backgroundColor: isOnline ? '#16C784' : '#EF4444' }]} onPress={handleToggleStatus}><Power size={15} color="#FFF"/><Text style={styles.onlineText}>{isOnline ? 'Online' : 'Offline'}</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.walletCard, walletBlocked && styles.walletCardBlocked]} onPress={() => setWalletModalVisible(true)} activeOpacity={0.84}>
          <View style={[styles.walletIcon, { backgroundColor: walletBlocked ? '#3A191D' : '#0A3526' }]}><WalletCards size={20} color={walletBlocked ? '#EF4444' : '#16C784'} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.walletLabel}>Mechanic wallet</Text>
            <Text style={styles.walletAmount}>৳{walletBalance.toLocaleString()}</Text>
            <Text style={[styles.walletHint, { color: walletBlocked ? '#F87171' : '#94A3B8' }]}>
              {walletBlocked ? `Blocked — recharge above ৳${MECHANIC_MIN_ACTIVE_WALLET}` : 'Cash-job platform fees are deducted here.'}
            </Text>
          </View>
          <PlusCircle size={19} color={walletBlocked ? '#EF4444' : '#16C784'} />
        </TouchableOpacity>

        <View style={styles.statRow}>
          <StatCard label="Requests" value={stats.requests} icon={<Wrench size={17} color="#16C784" />} accentColor="#16C784" compact />
          <StatCard label="Active" value={stats.active} icon={<Activity size={17} color="#38BDF8" />} accentColor="#38BDF8" compact />
        </View>
        <View style={styles.statRow}>
          <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 size={17} color="#FBBF24" />} accentColor="#FBBF24" compact />
          <StatCard label="Earnings" value={stats.earnings} icon={<Banknote size={17} color="#8B5CF6" />} accentColor="#8B5CF6" compact />
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tab, activeTab === 'feed' && styles.tabActive]} onPress={() => setActiveTab('feed')}><Text style={[styles.tabText, activeTab === 'feed' && styles.tabTextActive]}>Requests</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'active' && styles.tabActive]} onPress={() => setActiveTab('active')}><Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active Job</Text></TouchableOpacity>
        </View>

        {activeTab === 'feed' && requests.map(request => (
          <View key={request.id} style={styles.card}>
            <View style={styles.titleRow}><View style={styles.iconBox}><Wrench size={18} color="#16C784" /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{request.title}</Text><View style={styles.metaRow}><MapPin size={11} color="#64748B"/><Text style={styles.meta}>{request.distance}</Text></View></View><Text style={styles.reward}>{request.reward}</Text></View>
            <View style={styles.jobFeeRow}><Text style={styles.jobFeeLabel}>Estimated platform fee (10%)</Text><Text style={styles.jobFeeValue}>৳{Math.round(request.basePrice * 0.1)}</Text></View>
            <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: walletBlocked ? '#334155' : '#16C784' }]} onPress={() => handleAcceptRequest(request)}><Text style={styles.acceptText}>{walletBlocked ? 'Recharge wallet to accept' : 'Accept Job'}</Text></TouchableOpacity>
          </View>
        ))}

        {activeTab === 'feed' && requests.length === 0 && <View style={styles.empty}><Text style={styles.emptyTitle}>No new requests</Text><Text style={styles.emptyText}>Stay online to receive nearby jobs.</Text></View>}

        {activeTab === 'active' && activeJob && <View>
          <View style={styles.card}>
            <View style={styles.titleRow}><View style={styles.iconBox}><Wrench size={18} color="#38BDF8" /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{activeJob.title}</Text><Text style={styles.meta}>{activeJob.distance}</Text></View><StatusBadge text={activeJob.paymentStatus === 'paid_online' ? 'Paid' : 'Payment pending'} type={activeJob.paymentStatus === 'paid_online' ? 'success' : 'warning'} /></View>
            <View style={styles.mapWrap}><LiveMap userRole="mechanic" currentLocation={mechanicLocation} targetLocation={activeJob.customerLocation} /></View>
            <View style={styles.estimateCard}><Text style={styles.estimateTitle}>Billing summary</Text><View style={styles.jobFeeRow}><Text style={styles.jobFeeLabel}>Customer bill</Text><Text style={styles.jobFeeValue}>৳{activeJob.basePrice}</Text></View><View style={styles.jobFeeRow}><Text style={styles.jobFeeLabel}>10% platform fee</Text><Text style={styles.jobFeeValue}>৳{Math.round(activeJob.basePrice * 0.1)}</Text></View><View style={styles.jobFeeRow}><Text style={styles.jobFeeLabel}>Estimated mechanic earning</Text><Text style={styles.earningValue}>৳{Math.round(activeJob.basePrice * 0.9)}</Text></View></View>
            <TextInput style={styles.input} placeholder="Extra bill (৳)" placeholderTextColor="#64748B" keyboardType="numeric" value={extraBill} onChangeText={setExtraBill}/>
            <TextInput style={styles.input} placeholder="Reason for extra bill" placeholderTextColor="#64748B" value={extraBillReason} onChangeText={setExtraBillReason}/>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handlePushExtraBill}><Text style={styles.secondaryText}>Send Extra Bill</Text></TouchableOpacity>
            <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteJob}><Text style={styles.acceptText}>Complete Job</Text></TouchableOpacity>
          </View>
        </View>}
        {activeTab === 'active' && !activeJob && <View style={styles.empty}><Text style={styles.emptyTitle}>No active job</Text><Text style={styles.emptyText}>Accept a request to start a job.</Text></View>}
      </ScrollView>

      <BottomNavigation activeTab="Service" role="mechanic" navigation={navigation} accentColor="#16C784" />

      <Modal visible={walletModalVisible} transparent animationType="slide" onRequestClose={() => setWalletModalVisible(false)}>
        <View style={styles.overlay}><View style={styles.modal}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Mechanic Wallet</Text><TouchableOpacity onPress={() => setWalletModalVisible(false)}><X size={20} color="#94A3B8"/></TouchableOpacity></View>
          <Text style={styles.walletModalBalance}>৳{walletBalance.toLocaleString()}</Text>
          <Text style={styles.walletModalText}>Cash-service platform fee is deducted from this pre-funded wallet. Balance ৳{MECHANIC_MIN_ACTIVE_WALLET} or below blocks new jobs.</Text>
          <TextInput style={styles.input} placeholder="Recharge amount (৳)" placeholderTextColor="#64748B" keyboardType="numeric" value={walletRechargeAmount} onChangeText={setWalletRechargeAmount}/>
          <TouchableOpacity style={styles.completeBtn} onPress={handleRecharge} disabled={walletLoading}>{walletLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.acceptText}>Recharge Wallet</Text>}</TouchableOpacity>
        </View></View>
      </Modal>

      <Modal visible={ratingModalVisible} transparent animationType="slide" onRequestClose={() => setRatingModalVisible(false)}>
        <View style={styles.overlay}><View style={styles.modal}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Complete Service</Text><TouchableOpacity onPress={() => setRatingModalVisible(false)}><X size={20} color="#94A3B8"/></TouchableOpacity></View><TextInput style={[styles.input, { height: 90, textAlignVertical: 'top' }]} placeholder="Customer note / service report" placeholderTextColor="#64748B" multiline value={customerComment} onChangeText={setCustomerComment}/><TouchableOpacity style={styles.completeBtn} onPress={handleSubmitRating}><Text style={styles.acceptText}>Save & Complete</Text></TouchableOpacity></View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06111F' },
  scroll: { padding: 16, paddingBottom: 18 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 13 },
  heading: { color: '#F8FAFC', fontSize: 21, fontWeight: '900' },
  subheading: { color: '#64748B', fontSize: 10, marginTop: 3 },
  onlineBtn: { height: 38, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  walletCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A261B', borderRadius: 15, borderWidth: 1, borderColor: '#14532D', padding: 13, marginBottom: 11, gap: 10 },
  walletCardBlocked: { backgroundColor: '#281518', borderColor: '#7F1D1D' },
  walletIcon: { width: 43, height: 43, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  walletLabel: { color: '#94A3B8', fontSize: 9, fontWeight: '800' },
  walletAmount: { color: '#F8FAFC', fontSize: 18, fontWeight: '900', marginTop: 2 },
  walletHint: { fontSize: 9, lineHeight: 13, marginTop: 3 },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tabRow: { flexDirection: 'row', backgroundColor: '#0D1B2D', borderRadius: 13, padding: 4, marginTop: 7, marginBottom: 12, borderWidth: 1, borderColor: '#1B2B40' },
  tab: { flex: 1, height: 39, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#123B2A' },
  tabText: { color: '#64748B', fontSize: 11, fontWeight: '900' },
  tabTextActive: { color: '#16C784' },
  card: { backgroundColor: '#0D1B2D', borderRadius: 16, borderWidth: 1, borderColor: '#1B2B40', padding: 13, marginBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#083425', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '900' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  meta: { color: '#64748B', fontSize: 10 },
  reward: { color: '#F8FAFC', fontSize: 14, fontWeight: '900' },
  jobFeeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingVertical: 4 },
  jobFeeLabel: { color: '#64748B', fontSize: 9, flex: 1 },
  jobFeeValue: { color: '#CBD5E1', fontSize: 10, fontWeight: '800' },
  earningValue: { color: '#16C784', fontSize: 10, fontWeight: '900' },
  estimateCard: { backgroundColor: '#06111F', borderRadius: 12, borderWidth: 1, borderColor: '#1B2B40', padding: 10, marginTop: 11, marginBottom: 9 },
  estimateTitle: { color: '#F8FAFC', fontSize: 10, fontWeight: '900', marginBottom: 4 },
  acceptBtn: { height: 43, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 11 },
  acceptText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  mapWrap: { height: 235, overflow: 'hidden', borderRadius: 13, marginTop: 12, marginBottom: 11, borderWidth: 1, borderColor: '#24364C' },
  input: { height: 43, backgroundColor: '#06111F', borderWidth: 1, borderColor: '#24364C', borderRadius: 10, color: '#F8FAFC', paddingHorizontal: 10, marginBottom: 8, fontSize: 11 },
  secondaryBtn: { height: 43, borderRadius: 11, backgroundColor: '#17263A', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  secondaryText: { color: '#CBD5E1', fontSize: 11, fontWeight: '900' },
  completeBtn: { height: 46, borderRadius: 11, backgroundColor: '#16C784', alignItems: 'center', justifyContent: 'center' },
  empty: { minHeight: 210, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '900' },
  emptyText: { color: '#64748B', fontSize: 10, marginTop: 5 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 16 },
  modal: { backgroundColor: '#0D1B2D', borderRadius: 17, borderWidth: 1, borderColor: '#24364C', padding: 15 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '900' },
  walletModalBalance: { color: '#16C784', fontSize: 26, fontWeight: '900', marginBottom: 5 },
  walletModalText: { color: '#94A3B8', fontSize: 10, lineHeight: 16, marginBottom: 13 },
});
