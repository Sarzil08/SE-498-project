import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity as ActivityIcon, Car, CheckCircle2, Clock3, DollarSign, MapPin, ShieldCheck } from 'lucide-react-native';
import * as Location from 'expo-location';
import LiveMap from '../components/LiveMap';
import VehicleHealth from '../components/VehicleHealth';
import EmergencyMechanicRequest, { Mechanic } from '../components/EmergencyMechanicRequest';
import PaymentBox from '../components/PaymentBox';
import ReviewReportBox from '../components/ReviewReportBox';
import {
  AppHeader,
  BottomNavigation,
  QuickActionCard,
  RoleBadge,
  StatCard,
  StatusBadge,
} from '../components';
import { AppRole, ROLE_MAP } from '../components/RoleBadge';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { addNotification } from '../components/notificationStore';
import { addServiceHistory } from '../components/serviceHistoryStore';
import { useLanguage, tr } from '../context/LanguageContext';

export default function ServiceScreen({ route, navigation }: any) {
  const role: AppRole = route?.params?.role || 'customer';
  const accent = ROLE_MAP[role].color;
  const unread = useUnreadNotifications(role);

  if (role === 'mechanic') {
    return <MechanicServiceScreen navigation={navigation} accent={accent} unread={unread} />;
  }

  if (role === 'b2b') {
    return <B2BServiceScreen navigation={navigation} accent={accent} unread={unread} />;
  }

  return (
    <BuyerServiceScreen
      role={role}
      navigation={navigation}
      accent={accent}
      unread={unread}
      userId={route?.params?.userId || `${role}-demo`}
    />
  );
}

type BuyerServiceProps = {
  role: 'customer' | 'driver';
  navigation: any;
  accent: string;
  unread: number;
  userId: string;
};

function BuyerServiceScreen({ role, navigation, accent, unread, userId }: BuyerServiceProps) {
  const { language } = useLanguage();
  const isDriver = role === 'driver';
  const vehicle = isDriver ? 'Delivery Truck X-12' : 'Toyota Axio';

  const [location, setLocation] = useState({ latitude: 23.8103, longitude: 90.4125 });
  const [requestStatus, setRequestStatus] = useState<'idle' | 'searching' | 'list' | 'accepted'>('idle');
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [filteredMechanics, setFilteredMechanics] = useState<Mechanic[]>([]);
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null);
  const [hasExtraBill, setHasExtraBill] = useState(false);
  const [extraCharges, setExtraCharges] = useState(0);
  const [isExtraBillConfirmed, setIsExtraBillConfirmed] = useState(false);
  const [isBillPaid, setIsBillPaid] = useState(false);
  const [isRatingVisible, setIsRatingVisible] = useState(false);
  const [requestId, setRequestId] = useState(() => `service-${Date.now()}`);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const pendingAmount = 500;

  const loadLocation = async () => {
    setIsLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      }
    } catch (error) {
      console.log('Service location:', error);
    } finally {
      setIsLocationLoading(false);
    }
  };

  useEffect(() => {
    if (requestStatus !== 'accepted' || hasExtraBill) return;

    const timer = setTimeout(() => {
      setHasExtraBill(true);
      setExtraCharges(300);
      Alert.alert(
        tr(language, 'Extra bill', 'অতিরিক্ত বিল'),
        tr(
          language,
          'Mechanic added ৳300 for parts.',
          'মেকানিক পার্টস বাবদ ৳৩০০ অতিরিক্ত বিল যোগ করেছেন।'
        )
      );
    }, 5000);

    return () => clearTimeout(timer);
  }, [requestStatus, hasExtraBill, language]);

  const toggleProblem = (id: string) => {
    setSelectedProblems(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const findMechanic = (mode: 'manual' | 'auto', list: Mechanic[]) => {
    if (!selectedProblems.length) {
      Alert.alert(
        tr(language, 'Select a problem', 'সমস্যা সিলেক্ট করুন'),
        tr(
          language,
          'Please select at least one vehicle problem.',
          'অন্তত একটি গাড়ির সমস্যা সিলেক্ট করুন।'
        )
      );
      return;
    }

    setRequestStatus('searching');

    setTimeout(() => {
      setFilteredMechanics(list);
      if (mode === 'auto' && list.length) {
        selectMechanic(list[0]);
      } else {
        setRequestStatus('list');
      }
    }, 900);
  };

  const selectMechanic = async (mechanic: Mechanic) => {
    setRequestId(`service-${Date.now()}-${mechanic.id}`);
    setSelectedMechanic(mechanic);
    setRequestStatus('accepted');
    setHasExtraBill(false);
    setExtraCharges(0);
    setIsExtraBillConfirmed(false);
    setIsBillPaid(false);

    // Refresh location when the mechanic is accepted so the route line starts
    // from the latest available position.
    await loadLocation();
  };

  const finishReview = () => {
    if (selectedMechanic) {
      const total = pendingAmount + extraCharges;

      addServiceHistory({
        role,
        title: 'Roadside assistance',
        date: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        partner: selectedMechanic.name,
        amount: `৳${total.toLocaleString('en-BD')}`,
        status: 'completed',
        vehicle,
        location: 'Dhaka',
      });

      addNotification({
        role,
        title: 'Service completed',
        message: `${selectedMechanic.name} completed your roadside service. History updated.`,
        kind: 'service',
      });
    }

    setIsRatingVisible(false);
    setRequestStatus('idle');
    setSelectedMechanic(null);
    setSelectedProblems([]);
    setFilteredMechanics([]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#06111F" />

      <AppHeader
        name={isDriver ? 'Driver Service' : 'Vehicle Service'}
        email={ROLE_MAP[role].label}
        role={role}
        navigation={navigation}
        notificationCount={unread}
        onBack={() => navigation.goBack()}
        onProfile={() => navigation.navigate('ProfileScreen', { role, userId })}
        showSOS={false}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.pageBanner, { borderColor: accent }]}>
          <View style={[styles.bannerIcon, { backgroundColor: `${accent}22` }]}>
            <ActivityIcon size={22} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>
              {tr(language, 'Service Center', 'সার্ভিস সেন্টার')}
            </Text>
            <Text style={styles.bannerSub}>
              {tr(
                language,
                'Vehicle health and mechanic assistance are managed here.',
                'এখানেই গাড়ির হেলথ ও মেকানিক সার্ভিসের পুরো কাজ হবে।'
              )}
            </Text>
          </View>
          <RoleBadge role={role} />
        </View>

        {/* Full vehicle health belongs to Service, not Home. */}
        <Text style={styles.sectionTitle}>
          {tr(language, 'Vehicle Health', 'গাড়ির হেলথ')}
        </Text>
        <VehicleHealth driverId={isDriver ? 'v1' : 'c1'} />

        <Text style={styles.sectionTitle}>
          {tr(language, 'Find a Mechanic', 'মেকানিক খুঁজুন')}
        </Text>
        <EmergencyMechanicRequest
          requestStatus={requestStatus}
          selectedProblems={selectedProblems}
          detectedProblemTypes={[]}
          filteredMechanics={filteredMechanics}
          selectedMechanic={selectedMechanic}
          hasExtraBill={hasExtraBill}
          isExtraBillConfirmed={isExtraBillConfirmed}
          isBillPaid={isBillPaid}
          pendingAmount={pendingAmount}
          extraCharges={extraCharges}
          customerVehicle="Car"
          showAcceptedDetails={false}
          showPaymentButton={false}
          onToggleProblem={toggleProblem}
          onFindMechanic={findMechanic}
          onSelectMechanic={selectMechanic}
          onRequestStatusChange={setRequestStatus}
          onConfirmExtraBill={() => setIsExtraBillConfirmed(true)}
        />

        {/* No map before mechanic acceptance. After acceptance, the order is:
            heading -> map -> mechanic details. There is no second map below details. */}
        {requestStatus === 'accepted' && selectedMechanic && (
          <>
            <View style={styles.trackingHeader}>
              <View style={styles.trackingTitleWrap}>
                <View style={[styles.trackingIcon, { backgroundColor: `${accent}22` }]}>
                  <MapPin size={18} color={accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trackingTitle}>
                    {tr(language, 'Mechanic is coming your way', 'মেকানিক আপনার দিকে আসছে')}
                  </Text>
                  <Text style={styles.trackingSub}>
                    {tr(language, `${selectedMechanic.name} • ${selectedMechanic.distance}`, `${selectedMechanic.name} • ${selectedMechanic.distance}`)}
                  </Text>
                </View>
                {isLocationLoading ? <ActivityIndicator size="small" color={accent} /> : null}
              </View>
            </View>

            <View style={styles.mapWrap}>
              <LiveMap
                userRole={isDriver ? 'driver' : 'customer'}
                currentLocation={location}
                targetLocation={{
                  latitude: selectedMechanic.latitude,
                  longitude: selectedMechanic.longitude,
                }}
                height={400}
                fullBleed
              />
            </View>

            <View style={[styles.mechanicInfoCard, { borderColor: `${accent}55` }]}>
              <View style={styles.mechanicInfoTop}>
                <View style={[styles.mechanicAvatar, { backgroundColor: `${accent}22` }]}>
                  <Text style={[styles.mechanicAvatarText, { color: accent }]}>👨‍🔧</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mechanicInfoName}>{selectedMechanic.name}</Text>
                  <Text style={styles.mechanicInfoSpecialty}>{selectedMechanic.specialty}</Text>
                </View>
                <View style={styles.ratingPill}>
                  <Text style={styles.ratingPillText}>★ {selectedMechanic.rating}</Text>
                </View>
              </View>

              <View style={styles.infoGridNew}>
                <View style={styles.infoTile}>
                  <MapPin size={15} color={accent} />
                  <View>
                    <Text style={styles.infoTileLabel}>{tr(language, 'Distance', 'দূরত্ব')}</Text>
                    <Text style={styles.infoTileValue}>{selectedMechanic.distance}</Text>
                  </View>
                </View>
                <View style={styles.infoTile}>
                  <Text style={styles.tileEmoji}>☎</Text>
                  <View>
                    <Text style={styles.infoTileLabel}>{tr(language, 'Phone', 'ফোন')}</Text>
                    <Text style={styles.infoTileValue}>{selectedMechanic.phone}</Text>
                  </View>
                </View>
                <View style={styles.infoTile}>
                  <ShieldCheck size={15} color="#10B981" />
                  <View>
                    <Text style={styles.infoTileLabel}>{tr(language, 'Status', 'স্ট্যাটাস')}</Text>
                    <Text style={[styles.infoTileValue, { color: '#10B981' }]}>{tr(language, 'Verified', 'ভেরিফাইড')}</Text>
                  </View>
                </View>
                <View style={styles.infoTile}>
                  <Car size={15} color="#F59E0B" />
                  <View>
                    <Text style={styles.infoTileLabel}>{tr(language, 'Vehicle', 'যানবাহন')}</Text>
                    <Text style={styles.infoTileValue}>{selectedMechanic.vehicle}</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.directionMini, { borderColor: `${accent}33` }]}>
                <MapPin size={14} color={accent} />
                <Text style={styles.directionMiniText}>
                  {tr(language, 'Blue line shows the route to your location.', 'নীল route line আপনার লোকেশন পর্যন্ত পথ দেখাচ্ছে।')}
                </Text>
              </View>
            </View>

            <View style={styles.billSectionHeader}>
              <View style={[styles.billHeaderIcon, { backgroundColor: `${accent}22` }]}>
                <DollarSign size={18} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.billSectionTitle}>
                  {tr(language, 'Bill details & payment', 'বিল ডিটেইলস ও পেমেন্ট')}
                </Text>
                <Text style={styles.billSectionSub}>
                  {tr(language, 'Your invoice is shown directly below the mechanic details.', 'মেকানিকের ডিটেইলসের ঠিক নিচেই বিল ও পেমেন্ট দেওয়া হয়েছে।')}
                </Text>
              </View>
              {isBillPaid ? <StatusBadge text={tr(language, 'Paid', 'পেইড')} type="success" /> : null}
            </View>

            {hasExtraBill && !isExtraBillConfirmed && (
              <View style={[styles.extraBillConfirmCard, { borderColor: `${accent}55` }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.extraBillTitle}>
                    {tr(language, 'Extra bill waiting for confirmation', 'অতিরিক্ত বিল কনফার্ম করা বাকি')}
                  </Text>
                  <Text style={styles.extraBillText}>
                    {tr(language, 'The mechanic added ৳300 for parts/work. Confirm it before payment.', 'মেকানিক পার্টস/কাজের জন্য ৳৩০০ যোগ করেছেন। পেমেন্টের আগে কনফার্ম করুন।')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.confirmExtraButton, { backgroundColor: accent }]}
                  onPress={() => setIsExtraBillConfirmed(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmExtraText}>{tr(language, 'Confirm', 'কনফার্ম')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {(!hasExtraBill || isExtraBillConfirmed) && (
              <PaymentBox
                requestId={requestId}
                mechanicId={selectedMechanic?.id || 'mech-01'}
                baseFee={pendingAmount}
                extraCharges={extraCharges}
                onPaymentSuccess={() => {
                  setIsBillPaid(true);
                  setIsRatingVisible(true);
                }}
              />
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={isRatingVisible}
        transparent
        animationType="fade"
        onRequestClose={finishReview}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <ReviewReportBox
              requestId={requestId}
              fromUserId={userId}
              toUserId={selectedMechanic?.id || 'mech-01'}
              userRole={role}
              onComplete={finishReview}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={finishReview}
              activeOpacity={0.8}
            >
              <Text style={styles.closeText}>{tr(language, 'Finish', 'সমাপ্ত করুন')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNavigation
        activeTab="Service"
        role={role}
        navigation={navigation}
        accentColor={accent}
      />
    </SafeAreaView>
  );
}

function MechanicServiceScreen({
  navigation,
  accent,
  unread,
}: {
  navigation: any;
  accent: string;
  unread: number;
}) {
  const { language } = useLanguage();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#06111F" />
      <AppHeader
        name="Mechanic Service"
        email="Incoming jobs"
        role="mechanic"
        navigation={navigation}
        notificationCount={unread}
        onBack={() => navigation.goBack()}
        onProfile={() => navigation.navigate('ProfileScreen', { role: 'mechanic' })}
        showSOS={false}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.pageBanner, { borderColor: accent }]}>
          <View style={[styles.bannerIcon, { backgroundColor: `${accent}22` }]}>
            <ActivityIcon size={22} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>
              {tr(language, 'Mechanic Service Desk', 'মেকানিক সার্ভিস ডেস্ক')}
            </Text>
            <Text style={styles.bannerSub}>
              {tr(
                language,
                'Accept roadside jobs, manage active work and earnings.',
                'রোডসাইড কাজ নিন, চলমান কাজ ও আয় ম্যানেজ করুন।'
              )}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label={tr(language, 'New Jobs', 'নতুন কাজ')}
            value="08"
            icon={<Clock3 size={18} color={accent} />}
            accentColor={accent}
          />
          <StatCard
            label={tr(language, 'Today Earned', 'আজকের আয়')}
            value="৳4,850"
            icon={<DollarSign size={18} color={accent} />}
            accentColor={accent}
          />
        </View>

        <QuickActionCard
          title={tr(language, 'Open Job Feed', 'কাজের লিস্ট খুলুন')}
          subtitle={tr(
            language,
            'See nearby customers and accept a request.',
            'কাছের কাস্টমারের request দেখে কাজ গ্রহণ করুন।'
          )}
          icon={<MapPin size={20} color={accent} />}
          accentColor={accent}
          onPress={() => navigation.navigate('MechanicDashboard', { focus: 'service' })}
        />

        <QuickActionCard
          title={tr(language, 'My Active Job', 'আমার চলমান কাজ')}
          subtitle={tr(
            language,
            'Track the active service and customer.',
            'চলমান সার্ভিস ও কাস্টমার ট্র্যাক করুন।'
          )}
          icon={<ActivityIcon size={20} color={accent} />}
          accentColor={accent}
          onPress={() => navigation.navigate('MechanicDashboard', { focus: 'service' })}
        />

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {tr(language, 'Service checklist', 'সার্ভিস চেকলিস্ট')}
          </Text>
          {[
            ['Accept request', 'রিকোয়েস্ট গ্রহণ'],
            ['Reach customer', 'কাস্টমারের কাছে পৌঁছান'],
            ['Diagnose vehicle', 'গাড়ি পরীক্ষা'],
            ['Update extra bill', 'অতিরিক্ত বিল আপডেট'],
            ['Complete and review', 'কাজ সম্পন্ন ও রিভিউ'],
          ].map(([en, bn]) => (
            <View key={en} style={styles.checkRow}>
              <CheckCircle2 size={15} color={accent} />
              <Text style={styles.checkText}>{language === 'bn' ? bn : en}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNavigation
        activeTab="Service"
        role="mechanic"
        navigation={navigation}
        accentColor={accent}
      />
    </SafeAreaView>
  );
}

function B2BServiceScreen({
  navigation,
  accent,
  unread,
}: {
  navigation: any;
  accent: string;
  unread: number;
}) {
  const { language } = useLanguage();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#06111F" />
      <AppHeader
        name="Fleet Service"
        email="B2B maintenance"
        role="b2b"
        navigation={navigation}
        notificationCount={unread}
        onBack={() => navigation.goBack()}
        onProfile={() => navigation.navigate('ProfileScreen', { role: 'b2b' })}
        showSOS={false}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.pageBanner, { borderColor: accent }]}>
          <View style={[styles.bannerIcon, { backgroundColor: `${accent}22` }]}>
            <Car size={22} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>
              {tr(language, 'Fleet Service Center', 'ফ্লিট সার্ভিস সেন্টার')}
            </Text>
            <Text style={styles.bannerSub}>
              {tr(
                language,
                'Manage vehicle health, maintenance requests and priority rescue.',
                'গাড়ির হেলথ, মেইনটেন্যান্স ও প্রাইওরিটি রেসকিউ ম্যানেজ করুন।'
              )}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label={tr(language, 'Fleet', 'ফ্লিট')}
            value="120"
            icon={<Car size={18} color={accent} />}
            accentColor={accent}
          />
          <StatCard
            label={tr(language, 'Needs Service', 'সার্ভিস প্রয়োজন')}
            value="02"
            icon={<ActivityIcon size={18} color={accent} />}
            accentColor={accent}
          />
        </View>

        <QuickActionCard
          title={tr(language, 'Vehicle Maintenance', 'ভেহিকেল মেইনটেন্যান্স')}
          subtitle={tr(
            language,
            'Review vehicles that need attention.',
            'যেসব গাড়ির সার্ভিস দরকার সেগুলো দেখুন।'
          )}
          icon={<ActivityIcon size={20} color={accent} />}
          accentColor={accent}
          onPress={() =>
            Alert.alert(
              tr(language, 'Fleet maintenance', 'ফ্লিট মেইনটেন্যান্স'),
              tr(
                language,
                'Open a vehicle from the fleet dashboard to view full health and service history.',
                'ফ্লিট ড্যাশবোর্ড থেকে গাড়ি খুলে full health ও service history দেখুন।'
              )
            )
          }
        />

        <QuickActionCard
          title={tr(language, 'Request Priority Service', 'প্রাইওরিটি সার্ভিস নিন')}
          subtitle={tr(
            language,
            'Send an urgent request for a fleet vehicle.',
            'ফ্লিটের জরুরি গাড়ির জন্য request পাঠান।'
          )}
          icon={<ShieldCheck size={20} color={accent} />}
          accentColor={accent}
          onPress={() =>
            Alert.alert(
              tr(language, 'Request sent', 'রিকোয়েস্ট পাঠানো হয়েছে'),
              tr(
                language,
                'Priority fleet service request created.',
                'প্রাইওরিটি ফ্লিট সার্ভিস রিকোয়েস্ট তৈরি হয়েছে।'
              )
            )
          }
        />

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {tr(language, 'Priority vehicles', 'প্রাইওরিটি গাড়ি')}
          </Text>
          <View style={styles.vehicleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleName}>Delivery Truck X-12</Text>
              <Text style={styles.vehicleMeta}>Engine 92% • Brake Normal • Dhaka</Text>
            </View>
            <StatusBadge text="On Route" type="success" />
          </View>
          <View style={styles.vehicleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleName}>Cargo Van Y-04</Text>
              <Text style={styles.vehicleMeta}>Engine 90% • Maintenance due</Text>
            </View>
            <StatusBadge text="Needs Service" type="warning" />
          </View>
        </View>
      </ScrollView>

      <BottomNavigation
        activeTab="Service"
        role="b2b"
        navigation={navigation}
        accentColor={accent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06111F' },
  scroll: { padding: 16, paddingBottom: 22 },
  pageBanner: {
    backgroundColor: '#0D1B2D',
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '900' },
  bannerSub: { color: '#94A3B8', fontSize: 10, lineHeight: 15, marginTop: 3 },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
    marginTop: 4,
  },
  trackingHeader: { marginTop: 12, marginBottom: 8 },
  trackingTitleWrap: {
    backgroundColor: '#0D1B2D',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#1B2B40',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trackingIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '900' },
  trackingSub: { color: '#94A3B8', fontSize: 10, marginTop: 3 },
  mapWrap: {
    marginHorizontal: -16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1B2B40',
    marginBottom: 10,
  },
  directionCard: {
    backgroundColor: '#0D1B2D',
    borderRadius: 15,
    borderWidth: 1,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 14,
  },
  directionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionTitle: { color: '#F8FAFC', fontSize: 12, fontWeight: '900' },
  directionText: { color: '#94A3B8', fontSize: 10, lineHeight: 15, marginTop: 3 },
  mechanicInfoCard: {
    backgroundColor: '#0D1B2D',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 13,
  },
  mechanicInfoTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 13 },
  mechanicAvatar: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  mechanicAvatarText: { fontSize: 21 },
  mechanicInfoName: { color: '#F8FAFC', fontSize: 14, fontWeight: '900' },
  mechanicInfoSpecialty: { color: '#94A3B8', fontSize: 10, marginTop: 3 },
  ratingPill: { backgroundColor: '#241E10', borderWidth: 1, borderColor: '#6B4D10', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10 },
  ratingPillText: { color: '#F59E0B', fontSize: 10, fontWeight: '900' },
  infoGridNew: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoTile: { width: '48%', minHeight: 54, backgroundColor: '#06111F', borderWidth: 1, borderColor: '#18283B', borderRadius: 11, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoTileLabel: { color: '#64748B', fontSize: 8, marginBottom: 2 },
  infoTileValue: { color: '#F8FAFC', fontSize: 10, fontWeight: '800' },
  tileEmoji: { color: '#10B981', fontSize: 15, width: 15, textAlign: 'center' },
  directionMini: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: '#081523', borderWidth: 1, borderRadius: 10, padding: 9 },
  directionMiniText: { flex: 1, color: '#94A3B8', fontSize: 9, lineHeight: 13 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 13 },
  infoCard: {
    backgroundColor: '#0D1B2D',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#1B2B40',
    padding: 14,
    marginTop: 8,
  },
  infoTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '900', marginBottom: 10 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 },
  checkText: { color: '#CBD5E1', fontSize: 11 },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: '#1B2B40',
    gap: 10,
  },
  vehicleName: { color: '#F8FAFC', fontSize: 12, fontWeight: '900' },
  vehicleMeta: { color: '#64748B', fontSize: 10, marginTop: 3 },
  billSectionHeader: {
    backgroundColor: '#0D1B2D',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#1B2B40',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    marginBottom: 9,
  },
  billHeaderIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  billSectionTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '900' },
  billSectionSub: { color: '#64748B', fontSize: 9, lineHeight: 14, marginTop: 2 },
  extraBillConfirmCard: {
    backgroundColor: '#111D2C',
    borderWidth: 1,
    borderRadius: 13,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 9,
  },
  extraBillTitle: { color: '#F8FAFC', fontSize: 11, fontWeight: '900' },
  extraBillText: { color: '#94A3B8', fontSize: 9, lineHeight: 14, marginTop: 3, flex: 1 },
  confirmExtraButton: { minWidth: 74, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  confirmExtraText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
});
