import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Banknote, CreditCard, Smartphone, WalletCards, CheckCircle2 } from 'lucide-react-native';
import { layout } from '../theme/layout';
import {
  calculateCommission,
  getMechanicWallet,
  MECHANIC_MIN_ACTIVE_WALLET,
  PLATFORM_COMMISSION_RATE,
  recordServicePayment,
  PaymentMethod,
} from '../services/billingStore';

interface PaymentBoxProps {
  requestId: string;
  mechanicId?: string;
  baseFee: number;
  extraCharges: number;
  onPaymentSuccess: () => void;
}

const METHODS: Array<{ id: PaymentMethod; label: string; sub: string; icon: React.ReactNode }> = [
  { id: 'bkash', label: 'bKash', sub: 'Mobile payment', icon: <Smartphone size={18} color="#E2136E" /> },
  { id: 'nagad', label: 'Nagad', sub: 'Mobile payment', icon: <Smartphone size={18} color="#FA5A1E" /> },
  { id: 'card', label: 'Card', sub: 'Debit / credit card', icon: <CreditCard size={18} color="#38BDF8" /> },
  { id: 'cash', label: 'Cash', sub: 'Pay mechanic directly', icon: <Banknote size={18} color="#16C784" /> },
];

export default function PaymentBox({ requestId, mechanicId = 'mech-01', baseFee, extraCharges, onPaymentSuccess }: PaymentBoxProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const totalBill = Number(baseFee || 0) + Number(extraCharges || 0);
  const commission = useMemo(() => calculateCommission(totalBill), [totalBill]);
  const mechanicEarning = Math.max(0, totalBill - commission);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const wallet = await getMechanicWallet(mechanicId);
        if (mounted) setWalletBalance(wallet.balance);
      } catch (error) {
        console.log('Payment wallet load failed:', error);
      }
    })();
    return () => { mounted = false; };
  }, [mechanicId]);

  const selectMethod = async (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (method === 'cash') {
      try {
        const wallet = await getMechanicWallet(mechanicId);
        setWalletBalance(wallet.balance);
      } catch (error) {
        console.log('Payment wallet lookup failed:', error);
      }
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Car Rescue BD', 'দয়া করে একটি পেমেন্ট মাধ্যম সিলেক্ট করুন।');
      return;
    }

    setLoading(true);
    try {
      if (selectedMethod === 'cash') {
        const wallet = await getMechanicWallet(mechanicId);
        setWalletBalance(wallet.balance);
        if (wallet.balance <= MECHANIC_MIN_ACTIVE_WALLET) {
          throw new Error(`Mechanic wallet ৳${wallet.balance} এ blocked. Cash service চালু রাখতে wallet-এ ৳${MECHANIC_MIN_ACTIVE_WALLET + 1} এর বেশি রাখতে হবে।`);
        }
        if (wallet.balance < commission) {
          throw new Error(`Platform fee ৳${commission} দেওয়ার মতো wallet balance নেই। আগে wallet recharge করুন।`);
        }
      }

      // The local ledger gives the app a real, repeat-safe billing record.
      // bKash/Nagad/Card still require your production gateway credentials/server flow.
      const result = await recordServicePayment({
        requestId,
        mechanicId,
        totalAmount: totalBill,
        paymentMethod: selectedMethod,
        commissionRate: PLATFORM_COMMISSION_RATE,
      });

      setWalletBalance(result.walletBalanceAfter);

      const paymentLabel = selectedMethod === 'bkash' ? 'bKash' : selectedMethod === 'nagad' ? 'Nagad' : selectedMethod === 'card' ? 'Card' : 'Cash';
      const settlementText = selectedMethod === 'cash'
        ? `Customer pays ৳${totalBill} cash. Car Rescue fee ৳${commission} was deducted from mechanic wallet.\n\nMechanic wallet: ৳${result.walletBalanceAfter}`
        : `${paymentLabel} bill recorded for ৳${totalBill}.\n\nPlatform fee: ৳${commission}\nMechanic earning: ৳${mechanicEarning}`;

      Alert.alert(
        'Payment & Bill Confirmed',
        settlementText,
        [{ text: 'OK', onPress: onPaymentSuccess }],
      );
    } catch (error: any) {
      Alert.alert('Payment blocked', error?.message || 'Payment could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.paymentCard}>
      <View style={styles.titleRow}>
        <View style={styles.titleIcon}><WalletCards size={19} color="#38BDF8" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Car Rescue BD — Bill & Payment</Text>
          <Text style={styles.subtitle}>Pathao/Uber-style service invoice</Text>
        </View>
      </View>

      <View style={styles.invoiceCard}>
        <View style={styles.billRow}><Text style={styles.label}>Service / Visit fee</Text><Text style={styles.value}>৳{Number(baseFee || 0).toLocaleString()}</Text></View>
        <View style={styles.billRow}><Text style={styles.label}>Extra parts / work</Text><Text style={styles.value}>৳{Number(extraCharges || 0).toLocaleString()}</Text></View>
        <View style={styles.divider} />
        <View style={styles.billRow}><Text style={styles.totalLabel}>Customer total</Text><Text style={styles.totalValue}>৳{totalBill.toLocaleString()}</Text></View>
      </View>

      <View style={styles.feeCard}>
        <View style={styles.billRow}><Text style={styles.label}>Car Rescue platform fee (10%)</Text><Text style={styles.feeValue}>৳{commission.toLocaleString()}</Text></View>
        <View style={styles.billRow}><Text style={styles.label}>Mechanic earning</Text><Text style={styles.earningValue}>৳{mechanicEarning.toLocaleString()}</Text></View>
        {selectedMethod === 'cash' && (
          <Text style={styles.cashNote}>
            Cash payment হলে platform fee mechanic wallet থেকে auto deduct হবে।
          </Text>
        )}
      </View>

      {selectedMethod === 'cash' && (
        <View style={[styles.walletCard, walletBalance <= MECHANIC_MIN_ACTIVE_WALLET && styles.walletBlocked]}>
          <WalletCards size={17} color={walletBalance <= MECHANIC_MIN_ACTIVE_WALLET ? '#EF4444' : '#16C784'} />
          <View style={{ flex: 1 }}>
            <Text style={styles.walletTitle}>Mechanic wallet</Text>
            <Text style={styles.walletText}>৳{walletBalance.toLocaleString()}</Text>
          </View>
          <Text style={[styles.walletStatus, { color: walletBalance <= MECHANIC_MIN_ACTIVE_WALLET ? '#EF4444' : '#16C784' }]}>
            {walletBalance <= MECHANIC_MIN_ACTIVE_WALLET ? 'BLOCKED' : 'ACTIVE'}
          </Text>
        </View>
      )}

      <Text style={styles.methodTitle}>Choose payment method</Text>
      <View style={styles.methodList}>
        {METHODS.map(method => {
          const active = selectedMethod === method.id;
          return (
            <TouchableOpacity
              key={method.id}
              style={[styles.methodRow, active && styles.methodActive]}
              onPress={() => selectMethod(method.id)}
              activeOpacity={0.82}
            >
              <View style={styles.methodIcon}>{method.icon}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodLabel}>{method.label}</Text>
                <Text style={styles.methodSub}>{method.sub}</Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active ? <CheckCircle2 size={15} color="#38BDF8" /> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.payButton} onPress={handleProcessPayment} disabled={loading} activeOpacity={0.86}>
        {loading ? <ActivityIndicator color="#06111F" /> : <Text style={styles.payText}>Confirm ৳{totalBill.toLocaleString()} Payment</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  paymentCard: { backgroundColor: '#0D1B2D', borderWidth: 1, borderColor: '#1F3550', borderRadius: layout.radiusLg, padding: layout.cardPadding },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  titleIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#10243A', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#F8FAFC', fontSize: 14, fontWeight: '900' },
  subtitle: { color: '#64748B', fontSize: 10, marginTop: 2 },
  invoiceCard: { backgroundColor: '#06111F', borderWidth: 1, borderColor: '#1B2B40', borderRadius: 13, padding: 12 },
  feeCard: { backgroundColor: '#0A1422', borderWidth: 1, borderColor: '#1B2B40', borderRadius: 13, padding: 12, marginTop: 9 },
  billRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5, gap: 10 },
  label: { color: '#94A3B8', fontSize: 11, flex: 1 },
  value: { color: '#F8FAFC', fontSize: 12, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#1B2B40', marginVertical: 6 },
  totalLabel: { color: '#38BDF8', fontSize: 12, fontWeight: '900' },
  totalValue: { color: '#38BDF8', fontSize: 17, fontWeight: '900' },
  feeValue: { color: '#F59E0B', fontSize: 12, fontWeight: '900' },
  earningValue: { color: '#16C784', fontSize: 12, fontWeight: '900' },
  cashNote: { color: '#CBD5E1', fontSize: 9, lineHeight: 14, marginTop: 7 },
  walletCard: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#082417', borderWidth: 1, borderColor: '#14532D', borderRadius: 12, padding: 10, marginTop: 10 },
  walletBlocked: { backgroundColor: '#271416', borderColor: '#7F1D1D' },
  walletTitle: { color: '#94A3B8', fontSize: 9 },
  walletText: { color: '#F8FAFC', fontSize: 14, fontWeight: '900', marginTop: 1 },
  walletStatus: { fontSize: 9, fontWeight: '900' },
  methodTitle: { color: '#CBD5E1', fontSize: 11, fontWeight: '900', marginTop: 15, marginBottom: 8 },
  methodList: { gap: 8 },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#06111F', borderWidth: 1, borderColor: '#1B2B40', borderRadius: 12, padding: 10 },
  methodActive: { borderColor: '#38BDF8', backgroundColor: '#0C2033' },
  methodIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#0D1B2D', alignItems: 'center', justifyContent: 'center' },
  methodLabel: { color: '#F8FAFC', fontSize: 12, fontWeight: '900' },
  methodSub: { color: '#64748B', fontSize: 9, marginTop: 2 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#38BDF8' },
  payButton: { height: 46, borderRadius: 12, backgroundColor: '#38BDF8', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  payText: { color: '#06111F', fontSize: 12, fontWeight: '900' },
});
