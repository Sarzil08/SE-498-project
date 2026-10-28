import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { UserCheck, Cpu, MapPin, Star, Phone, ShieldCheck, Wrench, ChevronDown, ChevronUp } from 'lucide-react-native';
import { layout } from '../theme/layout';

export interface Mechanic {
  id: string;
  name: string;
  specialty: string;
  vehicle: string;
  problemType: string;
  rating: string;
  reviews: string;
  distance: string;
  phone: string;
  latitude: number;
  longitude: number;
}

export const DEMO_MECHANICS: Mechanic[] = [
  { id: '1', name: 'আব্দুর রহিম', specialty: 'ইঞ্জিন স্পেশালিস্ট', vehicle: 'Car', problemType: 'Engine', rating: '৪.৮', reviews: '১২০', distance: '২.৫ কিঃমিঃ', phone: '01711112233', latitude: 23.8155, longitude: 90.4165 },
  { id: '2', name: 'মোঃ করিম', specialty: 'টায়ার ও ব্রেক এক্সপার্ট', vehicle: 'Car', problemType: 'Tire/Brake', rating: '৪.৮', reviews: '৯৫', distance: '১.৮ কিঃমিঃ', phone: '01722223344', latitude: 23.8130, longitude: 90.4190 },
  { id: '3', name: 'জাকির হোসেন', specialty: 'ব্যাটারি ও ইলেকট্রিক্যাল এক্সপার্ট', vehicle: 'Car', problemType: 'Battery/Electrical', rating: '৪.৯', reviews: '১১০', distance: '৩.০ কিঃমিঃ', phone: '01733334455', latitude: 23.8174, longitude: 90.4128 },
];

interface Props {
  requestStatus: 'idle' | 'searching' | 'list' | 'accepted';
  selectedProblems: string[];
  detectedProblemTypes: string[];
  filteredMechanics: Mechanic[];
  selectedMechanic: Mechanic | null;
  hasExtraBill: boolean;
  isExtraBillConfirmed: boolean;
  isBillPaid: boolean;
  pendingAmount: number;
  extraCharges: number;
  customerVehicle?: string;
  onToggleProblem: (problemId: string) => void;
  onFindMechanic: (mode: 'manual' | 'auto', mechanicsList: Mechanic[]) => void;
  onSelectMechanic: (mechanic: Mechanic) => void;
  onRequestStatusChange: (status: 'idle' | 'searching' | 'list' | 'accepted') => void;
  onConfirmExtraBill: () => void;
  onOpenPayment?: () => void;
  showAcceptedDetails?: boolean;
  showPaymentButton?: boolean;
}

export default function EmergencyMechanicRequest({
  requestStatus,
  selectedProblems,
  detectedProblemTypes,
  filteredMechanics,
  selectedMechanic,
  hasExtraBill,
  isExtraBillConfirmed,
  isBillPaid,
  pendingAmount,
  extraCharges,
  customerVehicle = 'Car',
  onToggleProblem,
  onFindMechanic,
  onSelectMechanic,
  onRequestStatusChange,
  onConfirmExtraBill,
  onOpenPayment,
  showAcceptedDetails = true,
  showPaymentButton = true,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleTriggerSearch = (mode: 'manual' | 'auto') => {
    const allProblems = [...selectedProblems, ...detectedProblemTypes];
    if (!allProblems.length) {
      onFindMechanic(mode, []);
      return;
    }
    const results = DEMO_MECHANICS.filter(mech => mech.vehicle === customerVehicle && allProblems.includes(mech.problemType));
    onFindMechanic(mode, results);
  };

  return (
    <View style={styles.container}>
      {requestStatus === 'idle' ? (
        <View>
          <TouchableOpacity style={styles.toggleMainBtn} onPress={() => setIsExpanded(v => !v)} activeOpacity={0.8}>
            <View style={styles.toggleBtnInner}><Wrench size={18} color="#FFF" /><Text style={styles.toggleBtnText}>জরুরি মেকানিক রিকোয়েস্ট</Text></View>
            {isExpanded ? <ChevronUp size={20} color="#FFF" /> : <ChevronDown size={20} color="#FFF" />}
          </TouchableOpacity>

          {isExpanded && (
            <View style={styles.actionCard}>
              <Text style={styles.actionTitle}>🛠️ সমস্যার ধরন সিলেক্ট করুন</Text>
              <View style={styles.problemListGap}>
                {[
                  { id: 'Engine', label: '🛠️ ইঞ্জিনের সমস্যা' },
                  { id: 'Tire/Brake', label: '🛑 টায়ার বা ব্রেক' },
                  { id: 'Battery/Electrical', label: '⚡ ব্যাটারি বা ইলেকট্রিক্যাল' },
                ].map(p => {
                  const isSelected = selectedProblems.includes(p.id) || detectedProblemTypes.includes(p.id);
                  return (
                    <TouchableOpacity key={p.id} style={[styles.problemBtn, isSelected && styles.activeProblemBtn]} onPress={() => onToggleProblem(p.id)}>
                      <Text style={[styles.problemBtnText, isSelected && styles.activeProblemBtnText]}>{p.label} {isSelected ? '✅' : ''}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.searchModeRow}>
                <TouchableOpacity style={[styles.modeBtn, styles.manualBtn]} onPress={() => handleTriggerSearch('manual')}>
                  <UserCheck size={16} color="#FFF" /><Text style={styles.btnText}>ম্যানুয়াল সার্চ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeBtn, styles.autoBtn]} onPress={() => handleTriggerSearch('auto')}>
                  <Cpu size={16} color="#FFF" /><Text style={styles.btnText}>অটো সার্চ</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ) : requestStatus === 'searching' ? (
        <View style={styles.actionCard}><ActivityIndicator size="small" color="#38BDF8" /><Text style={styles.loadingText}>নিকটস্থ মেকানিক খোঁজা হচ্ছে...</Text></View>
      ) : requestStatus === 'list' ? (
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>🎯 নিকটস্থ মেকানিক</Text>
          {filteredMechanics.length > 0 ? filteredMechanics.map(mech => (
            <TouchableOpacity key={mech.id} style={styles.mechanicRow} onPress={() => onSelectMechanic(mech)}>
              <View style={styles.flexOne}><Text style={styles.mechanicName}>{mech.name}</Text><Text style={styles.mechanicDetails}>{mech.specialty} • ⭐ {mech.rating}</Text><Text style={styles.locationText}><MapPin size={11} color="#38BDF8" /> {mech.distance}</Text></View>
              <Text style={styles.requestLink}>অনুরোধ →</Text>
            </TouchableOpacity>
          )) : <Text style={styles.noResultText}>এই সমস্যার জন্য কোনো মেকানিক পাওয়া যায়নি।</Text>}
          <TouchableOpacity style={styles.backBtn} onPress={() => onRequestStatusChange('idle')}><Text style={styles.backBtnText}>◀ পেছনে</Text></TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>✅ মেকানিক আপনার দিকে আসছে</Text>
          {selectedMechanic && showAcceptedDetails && (
            <View style={styles.mechanicDetailCard}>
              <View style={styles.detailHeader}>
                <View><Text style={styles.detailName}>👨‍🔧 {selectedMechanic.name}</Text><Text style={styles.detailSpecialty}>{selectedMechanic.specialty}</Text></View>
                <View style={styles.ratingBadge}><Star size={12} color="#F59E0B" fill="#F59E0B" /><Text style={styles.ratingText}>{selectedMechanic.rating}</Text></View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}><MapPin size={14} color="#38BDF8" /><Text style={styles.infoText}>{selectedMechanic.distance}</Text></View>
                <View style={styles.infoItem}><Phone size={14} color="#10B981" /><Text style={styles.infoText}>{selectedMechanic.phone}</Text></View>
                <View style={styles.infoItem}><Wrench size={14} color="#F59E0B" /><Text style={styles.infoText}>{selectedMechanic.vehicle}</Text></View>
                <View style={styles.infoItem}><ShieldCheck size={14} color="#38BDF8" /><Text style={styles.infoText}>ভেরিফাইড</Text></View>
              </View>
            </View>
          )}

          {hasExtraBill && (
            <View style={[styles.extraBillBox, isExtraBillConfirmed && styles.extraBillConfirmedBox]}>
              <Text style={styles.extraBillText}>{isExtraBillConfirmed ? '✅ অতিরিক্ত বিল কনফার্মড' : '⚠️ পার্টস বাবদ +৳৩০০ বিল যোগ হয়েছে'}</Text>
              {!isExtraBillConfirmed && <TouchableOpacity style={styles.confirmBtn} onPress={onConfirmExtraBill}><Text style={styles.confirmBtnText}>কনফার্ম</Text></TouchableOpacity>}
            </View>
          )}

          {showPaymentButton && (!isBillPaid ? (
            <TouchableOpacity
              style={[styles.payBtn, { backgroundColor: hasExtraBill && !isExtraBillConfirmed ? '#475569' : '#EF4444' }]}
              onPress={onOpenPayment}
              disabled={!onOpenPayment}
            >
              <Text style={styles.btnText}>💳 বিল পরিশোধ করুন (৳{pendingAmount + extraCharges})</Text>
            </TouchableOpacity>
          ) : <Text style={styles.paymentSuccessText}>✓ বিল সফলভাবে পেইড</Text>)}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  toggleMainBtn: { backgroundColor: '#3B82F6', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: layout.itemGap, elevation: 3 },
  toggleBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  actionCard: { backgroundColor: '#1E293B', borderRadius: layout.radius, padding: layout.cardPadding, borderWidth: 1, borderColor: '#334155', marginTop: 4 },
  actionTitle: { fontSize: 15, fontWeight: 'bold', color: '#F8FAFC', marginBottom: layout.itemGapSm },
  problemListGap: { gap: layout.itemGap, marginTop: layout.itemGap },
  problemBtn: { backgroundColor: '#0F172A', padding: layout.itemGap, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  problemBtnText: { color: '#E2E8F0', fontSize: 13, lineHeight: 20 },
  activeProblemBtn: { borderColor: '#10B981', backgroundColor: '#064E3B' },
  activeProblemBtnText: { color: '#FFF' },
  searchModeRow: { flexDirection: 'row', gap: layout.itemGap, marginTop: layout.itemGapLg },
  modeBtn: { flex: 1, flexDirection: 'row', padding: layout.itemGap, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8 },
  manualBtn: { backgroundColor: '#3B82F6' },
  autoBtn: { backgroundColor: '#10B981' },
  btnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  loadingText: { color: '#FFF', textAlign: 'center', marginTop: layout.itemGap },
  mechanicRow: { flexDirection: 'row', backgroundColor: '#0F172A', padding: layout.itemGap, borderRadius: 10, alignItems: 'center', marginTop: layout.itemGapSm, borderWidth: 1, borderColor: '#334155' },
  flexOne: { flex: 1 },
  mechanicName: { color: '#FFF', fontWeight: 'bold' },
  mechanicDetails: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  locationText: { color: '#94A3B8', fontSize: 10, marginTop: 5, flexDirection: 'row', alignItems: 'center' },
  requestLink: { color: '#38BDF8', fontSize: 12 },
  backBtn: { alignItems: 'center', marginTop: layout.itemGapLg },
  backBtnText: { color: '#F87171' },
  noResultText: { color: '#94A3B8', textAlign: 'center', marginTop: 20, fontSize: 13 },
  mechanicDetailCard: { backgroundColor: '#0F172A', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#334155', marginTop: 8, marginBottom: 4 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  detailName: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  detailSpecialty: { color: '#38BDF8', fontSize: 12, marginTop: 2 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  ratingText: { color: '#F8FAFC', fontSize: 11, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 10 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '48%' },
  infoText: { color: '#94A3B8', fontSize: 11 },
  extraBillBox: { backgroundColor: '#7C2D12', borderColor: '#EA580C', borderWidth: 1, padding: layout.itemGap, borderRadius: 10, marginTop: layout.itemGap },
  extraBillConfirmedBox: { backgroundColor: '#064E3B', borderColor: '#10B981' },
  extraBillText: { color: '#FFF', fontWeight: 'bold', fontSize: 13, lineHeight: 20 },
  confirmBtn: { backgroundColor: '#EA580C', padding: layout.itemGapSm, borderRadius: 8, alignItems: 'center', marginTop: layout.itemGapSm },
  confirmBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  payBtn: { padding: layout.itemGap, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: layout.itemGapLg },
  paymentSuccessText: { color: '#10B981', fontWeight: 'bold', textAlign: 'center', marginTop: layout.itemGapLg },
});
