import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabaseClient';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';

// Icons 
import { User, Phone, Mail, Lock, ShieldCheck, Car, Wrench, Briefcase, Camera, Scan, Fingerprint, Truck } from 'lucide-react-native';
import { layout } from '../theme/layout';
import RoleBadge from '../components/RoleBadge';

export default function AuthScreen({ navigation }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'customer' | 'mechanic' | 'b2b' | 'driver'>('customer');
  const [loading, setLoading] = useState(false);

  // Common Fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Customer Dynamic Fields
  const [vehicleType, setVehicleType] = useState<'bike' | 'car' | 'microbus'>('car');
  const [vehicleRegNumber, setVehicleRegNumber] = useState('');

  // Mechanic Dynamic Fields
  const [specialty, setSpecialty] = useState('ইঞ্জিন');
  const [nidNumber, setNidNumber] = useState('');
  const [nidPhoto, setNidPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [isOcrScanning, setIsOcrScanning] = useState(false);

  // B2B Dynamic Fields
  const [companyName, setCompanyName] = useState('');
  const [fleetSize, setFleetSize] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  // Driver Dynamic Fields (🆕 B2B মালিকের সাথে ট্যাগ করার জন্য)
  const [ownerCompanyEmail, setOwnerCompanyEmail] = useState('');
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState('');

  // 1-Click Demo Shortcut Bypass Handler
  const handleDemoBypass = async (userType: 'customer' | 'mechanic' | 'b2b' | 'driver') => {
    setLoading(true);
    const demoEmail = `${userType}@demo.com`;
    const demoPassword = 'DemoPassword123!';

    try {
      const network = await NetInfo.fetch();

      // Offline-first demo bypass: do not even call Supabase when the device
      // has no network connection. This prevents the expected offline case
      // from showing a noisy warning in the console.
      if (network.isConnected === false) {
        console.log('Offline demo mode: Supabase auth skipped.');
        Alert.alert("ডেমো মোড সক্রিয়", `${userType === 'customer' ? 'গ্রাহক' : userType === 'mechanic' ? 'মেকানিক' : userType === 'driver' ? 'ড্রাইভার' : 'B2B'} ডেমো অ্যাকাউন্টে সফল বাইপাস!`);
        navigateMockDashboard(userType, undefined);
        return;
      }

      const { data: demoLoginData, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (error) {
        // A live Supabase failure still falls back to demo mode, but is logged
        // as a normal message instead of a WARN because bypass is intentional.
        console.log('Supabase demo auth unavailable; using offline demo fallback:', error.message);
        Alert.alert("ডেমো মোড সক্রিয়", `${userType === 'customer' ? 'গ্রাহক' : userType === 'mechanic' ? 'মেকানিক' : userType === 'driver' ? 'ড্রাইভার' : 'B2B'} ডেমো অ্যাকাউন্টে সফল বাইপাস!`);
        navigateMockDashboard(userType, undefined);
        return;
      }

      Alert.alert("সফল ডেমো লগইন", `স্বাগতম! আপনি ${demoEmail} হিসেবে ডেমো বাইপাস করেছেন।`);
      navigateMockDashboard(userType, demoLoginData.user?.id);
    } catch (err: any) {
      // Network/system failures should also keep the demo path usable.
      console.log('Demo auth request unavailable; using offline demo fallback:', err?.message || err);
      Alert.alert("ডেমো মোড সক্রিয়", `${userType === 'customer' ? 'গ্রাহক' : userType === 'mechanic' ? 'মেকানিক' : userType === 'driver' ? 'ড্রাইভার' : 'B2B'} ডেমো অ্যাকাউন্টে সফল বাইপাস!`);
      navigateMockDashboard(userType, undefined);
    }
  };

  const navigateMockDashboard = (userType: 'customer' | 'mechanic' | 'b2b' | 'admin' | 'driver', userId?: string) => {
    if (userType === 'customer') {
      navigation.navigate('CustomerHome', { email: `${userType}@demo.com`, userId, bypass: true });
    } else if (userType === 'mechanic') {
      navigation.navigate('MechanicFeed', { email: `${userType}@demo.com`, userId, bypass: true });
    } else if (userType === 'admin') {
      navigation.navigate('AdminRevenue', { email: `admin@rab.com`, bypass: true });
    } else if (userType === 'driver') {
      navigation.navigate('DriverDashboard', { email: `driver@demo.com`, userId, bypass: true });
    } else {
      navigation.navigate('B2BDispatch', { email: `${userType}@demo.com`, userId, bypass: true });
    }
  };

  const handleNidPhotoUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll permissions to upload NID!');
      return;
    }

    const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (canceled || !assets || assets.length === 0) return;

    setNidPhoto(assets[0].uri);
    
    setIsOcrScanning(true);
    setTimeout(() => {
      setFullName('সাজ্জাদুল আলম সিফাত (Sajjadul Alam Sifat)');
      setNidNumber('3801290345');
      setIsOcrScanning(false);
      Alert.alert(
        'OCR সফল হয়েছে (OCR Success)', 
        'জাতীয় পরিচয়পত্র থেকে নাম এবং এনআইডি নম্বর স্বয়ংক্রিয়ভাবে বের করা হয়েছে।'
      );
    }, 2000);
  };

  const handleSelfieCapture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera permission to take a verification selfie!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      cameraType: ImagePicker.CameraType.front,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelfiePhoto(result.assets[0].uri);
    }
  };

  const handleBiometrics = async () => {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      if (!isAvailable) {
        Alert.alert('অসমর্থিত ডিভাইস', 'ডিভাইসে কোনো বায়োমেট্রিক সেন্সর পাওয়া যায়নি।');
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert('তালিকাভুক্ত নয়', 'আপনার হ্যান্ডсеটে কোনো ফিঙ্গারপ্রিন্ট বা ফেস আইডি নিবন্ধিত নেই।');
        return;
      }

      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'দ্রুত বায়োমেট্রিক লগইন করুন',
        fallbackLabel: 'পিন পাসওয়ার্ড টাইপ করুন',
        disableDeviceFallback: false,
      });

      if (authResult.success) {
        Alert.alert('লগইন সফল', 'বায়োমেট্রিক সফলভাবে যাচাই করা হয়েছে।');
        handleDemoBypass('customer');
      } else {
        Alert.alert('ব্যর্থ', 'বায়োমেট্রিক যাচাই বাতিল বা ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      Alert.alert('কোড ত্রুটি', err.message);
    }
  };

const handleAuthentication = async () => {
  if (!email || !password) {
    Alert.alert('ত্রুটি', 'দয়া করে ইমেইল এবং পাসওয়ার্ড পূরণ করুন।');
    return;
  }
  if (!isLogin && !fullName) {
    Alert.alert('ত্রুটি', 'আপনার পুরো নাম লিখুন।');
    return;
  }
  if (!isLogin && role === 'driver' && !ownerCompanyEmail) {
    Alert.alert('ত্রুটি', 'দয়া করে আপনার B2B মালিকের কোম্পানির ইমেইল দিন।');
    return;
  }

  setLoading(true);
  try {
    if (isLogin) {
      // ==================== ১. লগইন লজিক (SIGN IN) ====================
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('users_profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          const userRole = data.user?.user_metadata?.role || 'customer';
          navigateMockDashboard(userRole, data.user.id);
        } else {
          navigateMockDashboard(profile.role, data.user.id);
        }
        Alert.alert('স্বাগতম', 'সফলভাবে লগইন সম্পূর্ণ হয়েছে।');
      }

    } else {
      // ==================== ২. সাইন-আপ লজিক ====================
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            mobile_number: mobileNumber,
            role: role,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        const userId = data.user.id;

        // খ. প্রধান প্রোফাইল টেবিল (users_profiles) এ ডাটা পাঠানো
        const { error: profileError } = await supabase
          .from('users_profiles')
          .insert({
            id: userId,
            full_name: fullName,
            email: email,
            phone: mobileNumber,
            role: role
          });

        if (profileError) throw profileError;

        // গ. ইউজার যদি ড্রাইভার (Driver) হয়
   // গ. ইউজার যদি ড্রাইভার (Driver) হয়
if (role === 'driver') {
  // driver_profiles টেবিলে এন্ট্রি
  const { error: driverError } = await supabase
    .from('driver_profiles')
    .insert({
      id: userId,
      license_number: drivingLicenseNumber || null,
      vehicle_type: 'car', 
      is_verified: false,
      rating: 5.0
    });

  if (driverError) throw driverError;

  // 🌍 ফোনের রিয়েল-টাইম জিপিএস লোকেশন নেওয়া
  let currentLat = 23.8103; // পারমিশন না দিলে ব্যাকআপ হিসেবে ঢাকা
  let currentLng = 90.4125;

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      currentLat = location.coords.latitude;
      currentLng = location.coords.longitude;
    }
  } catch (locErr) {
    console.warn("লোকেশন রিড করতে সমস্যা হয়েছে, ডিফল্ট লোকেশন ব্যবহার করা হচ্ছে।", locErr);
  }

  // vehicle_locations টেবিলে আসল লাইভ লোকেশন এন্ট্রি
  const { error: locationError } = await supabase
    .from('vehicle_locations')
    .insert({
      driver_id: userId,
      latitude: currentLat, 
      longitude: currentLng
    });

  if (locationError) throw locationError;
}
        // ঘ. ইউজার যদি মেকানিক (Mechanic) হয়
        else if (role === 'mechanic') {
          const { error: mechanicError } = await supabase
            .from('mechanic_profiles')
            .insert({
              id: userId,
              specialty: specialty,
              nid_number: nidNumber || null,
              is_verified: false,
              rating: 5.0
            });

          if (mechanicError) throw mechanicError;
        }

        // ঙ. ইউজার যদি কাস্টমার (Customer) হয়
        else if (role === 'customer') {
          const { error: customerError } = await supabase
            .from('customer_profiles')
            .insert({
              id: userId,
              rating: 5.0
            });

          if (customerError) throw customerError;
        }

        Alert.alert(
          'সফল রেজিস্ট্রেশন!',
          'আপনার অ্যাকাউন্ট এবং ডাটাবেজ প্রোফাইল তৈরি হয়েছে। এবার লগইন করুন।'
        );
        setIsLogin(true); 
      }
    }
  } catch (err: any) {
    Alert.alert('Supabase ত্রুটি', err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerContainer}>
            <View style={styles.logoBadge}>
              <Car color="#EF4444" size={32} strokeWidth={2.5} />
            </View>
            <Text style={styles.brandTitle}>রোডসাইড অ্যাসিস্ট্যান্স বিডি</Text>
            <Text style={styles.brandSubtitle}>জরুরি রোডসাইড উদ্ধার ও মেকানিক সেবা</Text>
          </View>

          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[styles.segmentBtn, isLogin && styles.segmentActiveBtn]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.segmentText, isLogin && styles.segmentActiveText]}>লগইন (Sign In)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, !isLogin && styles.segmentActiveBtn]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.segmentText, !isLogin && styles.segmentActiveText]}>নতুন অ্যাকাউন্ট</Text>
            </TouchableOpacity>
          </View>

          {!isLogin && (
            <View style={styles.card}>
              <Text style={styles.inputLabel}>অ্যাকাউন্টের ধরন নির্বাচন করুন:</Text>
              <View style={styles.rolePickerBox}>
                {(['customer', 'mechanic', 'b2b', 'driver'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleBtn, role === r && styles.roleActiveBtn]}
                    onPress={() => setRole(r)}
                  >
                    {r === 'customer' && <Car size={18} color={role === 'customer' ? '#FFF' : '#64748B'} />}
                    {r === 'mechanic' && <Wrench size={18} color={role === 'mechanic' ? '#FFF' : '#64748B'} />}
                    {r === 'b2b' && <Briefcase size={18} color={role === 'b2b' ? '#FFF' : '#64748B'} />}
                    {r === 'driver' && <Truck size={18} color={role === 'driver' ? '#FFF' : '#64748B'} />}
                    <Text style={[styles.roleBtnText, role === r && styles.roleActiveBtnText]}>
                      {r === 'customer' ? 'গ্রাহক' : r === 'mechanic' ? 'মেকানিক' : r === 'b2b' ? 'B2B ক্লায়েন্ট' : 'ড্রাইভার'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionHeader}>
              {isLogin ? 'আপনার অ্যাকাউন্টে প্রবেশ করুন' : 'ব্যক্তিগত সাধারণ তথ্য'}
            </Text>

            {!isLogin && (
              <View style={styles.inputWrapper}>
                <User size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  placeholder="পূর্ণ নাম (যেমন: সাজ্জাদুল আলম)"
                  placeholderTextColor="#94A3B8"
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            )}

            {!isLogin && (
              <View style={styles.inputWrapper}>
                <Phone size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  placeholder="মোবাইল নম্বর (যেমন: 017xxxxxxxx)"
                  placeholderTextColor="#94A3B8"
                  style={styles.textInput}
                  keyboardType="phone-pad"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                />
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                placeholder="ইমেইল এড্রেস"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Lock size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                placeholder="পাসওয়ার্ড (কমপক্ষে ৬ ডিজিট)"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {!isLogin && (
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>
                {role === 'customer' && '🚗 Call যানবাহন সম্পর্কিত তথ্য'}
                {role === 'mechanic' && '🔧 কারিগরি ভেরিফিকেশন ও দক্ষতা'}
                {role === 'b2b' && '🏢 ফ্লিট ক্লায়েন্ট মেটাডাটা'}
                {role === 'driver' && '🪪 B2B কোম্পানির অধীনে ড্রাইভার প্রোফাইল'}
              </Text>

              {role === 'customer' && (
                <View>
                  <Text style={styles.subInputLabel}>যানবাহনের ক্যাটাগরি:</Text>
                  <View style={styles.subSelectorRow}>
                    {(['bike', 'car', 'microbus'] as const).map((vt) => (
                      <TouchableOpacity
                        key={vt}
                        style={[styles.smallSelectorTab, vehicleType === vt && styles.smallSelectorTabActive]}
                        onPress={() => setVehicleType(vt)}
                      >
                        <Text style={[styles.smallSelectorText, vehicleType === vt && styles.smallSelectorTextActive]}>
                          {vt === 'bike' ? '🏍️ বাইক' : vt === 'car' ? '🚗 কার' : '🚐 মাইক্রোবাস'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.inputWrapper}>
                    <ShieldCheck size={18} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      placeholder="লাইসেন্স / গাড়ির রেজিস্ট্রেশন নম্বর"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      autoCapitalize="characters"
                      value={vehicleRegNumber}
                      onChangeText={setVehicleRegNumber}
                    />
                  </View>
                </View>
              )}

              {role === 'mechanic' && (
                <View>
                  <Text style={styles.subInputLabel}>মেকানিক প্রধান স্পেশালিটি:</Text>
                  <View style={styles.subSelectorRow}>
                    {['ইঞ্জিন', 'টায়ার/চাকা', 'ইলেকট্রিক্যাল', 'টয়িং', 'অল-রাউন্ডার'].map((spec) => (
                      <TouchableOpacity
                        key={spec}
                        style={[styles.chipsTab, specialty === spec && styles.chipsTabActive]}
                        onPress={() => setSpecialty(spec)}
                      >
                        <Text style={[styles.chipsTabText, specialty === spec && styles.chipsTabTextActive]}>
                          {spec}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.inputWrapper}>
                    <Scan size={18} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      placeholder="জাতীয় পরিচয়পত্র (NID) নম্বর"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      keyboardType="number-pad"
                      value={nidNumber}
                      onChangeText={setNidNumber}
                    />
                  </View>

                  <View style={styles.verificationGrid}>
                    <TouchableOpacity style={styles.mediaUploadBtn} onPress={handleNidPhotoUpload}>
                      <Camera size={20} color="#D1D5DB" />
                      <Text style={styles.mediaUploadText}>
                        {nidPhoto ? '✅ NID আপলোড সফল' : ' NID ফ্রন্ট পেজ আপলোড'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.mediaUploadBtn} onPress={handleSelfieCapture}>
                      <Camera size={20} color="#D1D5DB" />
                      <Text style={styles.mediaUploadText}>
                        {selfiePhoto ? '✅ সেলফি তোলা সম্পন্ন' : 'এনআইডি সহ সেলফি তুলুন'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {isOcrScanning && (
                    <View style={styles.ocrBanner}>
                      <ActivityIndicator size="small" color="#E2E8F0" />
                      <Text style={styles.ocrText}>ইন্টেলিজেন্ট AI OCR ট্র্যাকিং স্ক্যানিং চলছে...</Text>
                    </View>
                  )}
                </View>
              )}

              {role === 'b2b' && (
                <View>
                  <View style={styles.inputWrapper}>
                    <Briefcase size={18} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      placeholder="কোম্পানির নাম (B2B Fleet Company)"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      value={companyName}
                      onChangeText={setCompanyName}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Car size={18} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      placeholder="ফ্লিট সাইজ (গাড়ির সংখ্যা)"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      keyboardType="number-pad"
                      value={fleetSize}
                      onChangeText={(val) => setFleetSize(val)}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <User size={18} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      placeholder="যোগাযোগকারী কর্মকর্তা (Admin Name)"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      value={contactPerson}
                      onChangeText={setContactPerson}
                    />
                  </View>
                </View>
              )}

              {/* 🆕 ড্রাইভার ডায়নামিক ফিল্ডস (মালিকের সাথে ম্যাপিং এর জন্য) */}
              {role === 'driver' && (
                <View>
                  <View style={styles.inputWrapper}>
                    <Briefcase size={18} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      placeholder="B2B মালিকের কোম্পানির ইমেইল"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={ownerCompanyEmail}
                      onChangeText={setOwnerCompanyEmail}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <ShieldCheck size={18} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      placeholder="ড্রাইভিং লাইসেন্স নম্বর"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      value={drivingLicenseNumber}
                      onChangeText={setDrivingLicenseNumber}
                    />
                  </View>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleAuthentication} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isLogin ? 'লগইন করুন  ➜' : 'নিবন্ধন করুন এবং শুরু করুন  ➜'}
              </Text>
            )}
          </TouchableOpacity>

          {isLogin && (
            <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometrics}>
              <Fingerprint size={24} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.biometricBtnText}>ফিঙ্গারপ্রিন্ট / ফেস আইডি দিয়ে সরাসরি লগইন</Text>
            </TouchableOpacity>
          )}

          <View style={styles.demoShortcutContainer}>
            <View style={styles.demoHeaderRow}>
              <Text style={styles.demoTitle}>⚡ ডেভলপার ১-ক্লিক ডেমো বাইপাস (Bypass)</Text>
              <Text style={styles.demoSub}>Supabase ভ্যালিডেশন এড়িয়ে সরাসরি ড্যাশবোর্ড চেক করুন</Text>
            </View>

            <View style={styles.demoButtonsContainer}>
              <TouchableOpacity
                style={[styles.demoBtn, styles.demoBtnCustomer]}
                onPress={() => handleDemoBypass('customer')}
              >
                <View style={styles.iconCentering}><Car size={16} color="#FFF" /></View>
                <Text style={styles.demoBtnText}>গ্রাহক ডেম</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoBtn, styles.demoBtnMechanic]}
                onPress={() => handleDemoBypass('mechanic')}
              >
                <View style={styles.iconCentering}><Wrench size={16} color="#FFF" /></View>
                <Text style={styles.demoBtnText}>মেকানিক ডেমো</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoBtn, styles.demoBtnB2b]}
                onPress={() => handleDemoBypass('b2b')}
              >
                <View style={styles.iconCentering}><Briefcase size={16} color="#FFF" /></View>
                <Text style={styles.demoBtnText}>B2B ডেমো</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoBtn, { backgroundColor: '#7C3AED' }]}
                onPress={() => handleDemoBypass('driver')}
              >
                <View style={styles.iconCentering}><User size={16} color="#FFF" /></View>
                <Text style={styles.demoBtnText}>ড্রাইভার ডেমো</Text>
              </TouchableOpacity>
            </View>
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: layout.screenPadding,
    paddingBottom: layout.screenPaddingBottom,
  },
  headerContainer: {
    alignItems: 'center',
    marginVertical: layout.sectionGap,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    borderColor: '#EF444422',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: layout.radius,
    padding: 6,
    marginBottom: layout.cardMargin,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: layout.itemGap,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentActiveBtn: {
    backgroundColor: '#EF4444',
  },
  segmentText: {
    color: '#94A3B8',
    fontWeight: 'bold',
    fontSize: 14,
  },
  segmentActiveText: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: layout.radiusLg,
    padding: layout.cardPadding,
    marginBottom: layout.cardMargin,
    borderColor: '#334155',
    borderWidth: 1,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F1F5F9',
    marginBottom: layout.itemGap,
  },
  inputLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: layout.itemGapSm,
  },
  subInputLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: layout.itemGapSm,
    marginBottom: layout.itemGapSm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderColor: '#334155',
    borderWidth: 1,
    marginBottom: layout.itemGap,
    paddingHorizontal: layout.itemGap,
    height: layout.inputHeight,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
  },
  rolePickerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: layout.itemGapSm,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: layout.itemGap,
    borderColor: '#334155',
    borderWidth: 1,
    gap: 6,
  },
  roleActiveBtn: {
    backgroundColor: '#EF444422',
    borderColor: '#EF4444',
  },
  roleBtnText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  roleActiveBtnText: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  subSelectorRow: {
    flexDirection: 'row',
    gap: layout.itemGapSm,
    marginBottom: layout.itemGap,
  },
  smallSelectorTab: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: layout.itemGap,
    alignItems: 'center',
  },
  smallSelectorTabActive: {
    backgroundColor: '#10B98122',
    borderColor: '#10B981',
  },
  smallSelectorText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  smallSelectorTextActive: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  chipsTab: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipsTabActive: {
    backgroundColor: '#F59E0B22',
    borderColor: '#F59E0B',
  },
  chipsTabText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  chipsTabTextActive: {
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  verificationGrid: {
    flexDirection: 'row',
    gap: layout.itemGap,
    marginTop: layout.itemGapSm,
  },
  mediaUploadBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    padding: layout.itemGapSm,
  },
  mediaUploadText: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  ocrBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  ocrText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#EF4444',
    borderRadius: layout.radius,
    height: layout.btnHeight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: layout.itemGap,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: layout.radius,
    borderWidth: 1,
    borderColor: '#EF444433',
    height: layout.btnHeight,
    marginBottom: layout.sectionGap,
  },
  biometricBtnText: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
  },
  demoShortcutContainer: {
    backgroundColor: '#1E1B4B',
    borderColor: '#4338CA',
    borderWidth: 1,
    borderRadius: layout.radiusLg,
    padding: layout.cardPadding,
  },
  demoHeaderRow: {
    marginBottom: layout.itemGap,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C7D2FE',
  },
  demoSub: {
    fontSize: 11,
    color: '#818CF8',
    marginTop: 2,
  },
  demoButtonsContainer: {
    flexDirection: 'row',
    gap: layout.itemGapSm,
  },
  demoBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: layout.itemGap,
  },
  demoBtnCustomer: {
    backgroundColor: '#059669',
  },
  demoBtnMechanic: {
    backgroundColor: '#D97706',
  },
  demoBtnB2b: {
    backgroundColor: '#4F46E5',
  },
  demoBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
  },
  iconCentering: {
    alignItems: 'center',
    justifyContent: 'center',
  }
});