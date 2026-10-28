import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BriefcaseBusiness, Building2, Car, Mail, Phone, Save, ShieldCheck, User, Users, Wrench } from 'lucide-react-native';
import { supabase } from '../supabaseClient';
import { ProfileField, ProfileHeader, ProfileSection, StatusBadge, ROLE_MAP, AppRole } from '../components';

type Role = AppRole;

export default function ProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<Role>('customer');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  const [vehicleRegNumber, setVehicleRegNumber] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [fleetSize, setFleetSize] = useState('1');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [assignedVehicleReg, setAssignedVehicleReg] = useState('');

  const color = ROLE_MAP[role].color;
  const initials = useMemo(() => fullName.trim().split(/\s+/).filter(Boolean).slice(0,2).map(x => x[0]).join('').toUpperCase() || 'U', [fullName]);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('লগইন প্রয়োজন', 'প্রোফাইল দেখতে লগইন করুন।', [{ text: 'Login', onPress: () => navigation.replace('AuthScreen') }]);
        return;
      }

      setEmail(user.email || '');
      const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error) throw error;

      const currentRole = (profile?.role || 'customer') as Role;
      const safeRole: Role = ROLE_MAP[currentRole] ? currentRole : 'customer';
      setRole(safeRole);
      setFullName(profile?.full_name || '');
      setMobileNumber(profile?.mobile_number || '');

      if (safeRole === 'customer') {
        const { data } = await supabase.from('customer_profiles').select('*').eq('id', user.id).maybeSingle();
        setVehicleType(data?.vehicle_type || 'car');
        setVehicleRegNumber(data?.vehicle_reg_number || '');
      } else if (safeRole === 'mechanic') {
        const { data } = await supabase.from('mechanic_profiles').select('*').eq('id', user.id).maybeSingle();
        setSpecialty(data?.specialty || '');
        setNidNumber(data?.nid_number || '');
      } else if (safeRole === 'b2b') {
        const { data } = await supabase.from('b2b_profiles').select('*').eq('id', user.id).maybeSingle();
        setCompanyName(data?.company_name || '');
        setContactPerson(data?.contact_person || '');
        setFleetSize(String(data?.fleet_size || 1));
      } else if (safeRole === 'driver') {
        const { data } = await supabase.from('driver_profiles').select('*').eq('id', user.id).maybeSingle();
        setLicenseNumber(data?.license_number || '');
        setAssignedVehicleReg(data?.assigned_vehicle_reg || '');
      }
    } catch (e: any) {
      console.error('Profile load:', e);
      Alert.alert('Error', 'Profile load করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: masterError } = await supabase.from('profiles').update({ full_name: fullName.trim(), mobile_number: mobileNumber.trim() }).eq('id', user.id);
      if (masterError) throw masterError;

      if (role === 'customer') {
        const { error } = await supabase.from('customer_profiles').upsert({ id: user.id, vehicle_type: vehicleType.trim(), vehicle_reg_number: vehicleRegNumber.trim() });
        if (error) throw error;
      } else if (role === 'mechanic') {
        const { error } = await supabase.from('mechanic_profiles').upsert({ id: user.id, specialty: specialty.trim(), nid_number: nidNumber.trim() });
        if (error) throw error;
      } else if (role === 'b2b') {
        const { error } = await supabase.from('b2b_profiles').upsert({ id: user.id, company_name: companyName.trim(), contact_person: contactPerson.trim(), fleet_size: parseInt(fleetSize, 10) || 1 });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('driver_profiles').upsert({ id: user.id, license_number: licenseNumber.trim(), assigned_vehicle_reg: assignedVehicleReg.trim() });
        if (error) throw error;
      }

      Alert.alert('সফল', 'আপনার প্রোফাইল আপডেট হয়েছে।');
    } catch (e: any) {
      Alert.alert('Error', 'সংরক্ষণ করতে ব্যর্থ: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={color} /><Text style={styles.loadingText}>Profile loading...</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#06111F" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={styles.backText}>‹</Text></TouchableOpacity>
        <Text style={styles.topTitle}>My Profile</Text>
        <StatusBadge text={ROLE_MAP[role].label} type="info" />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ProfileHeader name={fullName} role={role} subtitle={ROLE_MAP[role].label} avatarText={initials} />

        <ProfileSection title="Basic Information" accentColor={color} icon={<User size={17} color={color} />}>
          <ProfileField label="Full Name" value={fullName} onChangeText={setFullName} icon={User} accentColor={color} />
          <ProfileField label="Email" value={email} editable={false} icon={Mail} accentColor={color} />
          <ProfileField label="Phone" value={mobileNumber} onChangeText={setMobileNumber} keyboardType="phone-pad" icon={Phone} accentColor={color} />
        </ProfileSection>

        {role === 'customer' && (
          <ProfileSection title="Vehicle Information" accentColor={color} icon={<Car size={17} color={color} />}>
            <ProfileField label="Vehicle Type" value={vehicleType} onChangeText={setVehicleType} icon={Car} accentColor={color} />
            <ProfileField label="Registration Number" value={vehicleRegNumber} onChangeText={setVehicleRegNumber} icon={Car} accentColor={color} />
          </ProfileSection>
        )}

        {role === 'mechanic' && (
          <ProfileSection title="Professional Details" accentColor={color} icon={<Wrench size={17} color={color} />}>
            <ProfileField label="Specialty" value={specialty} onChangeText={setSpecialty} icon={Wrench} accentColor={color} />
            <ProfileField label="NID Number" value={nidNumber} onChangeText={setNidNumber} keyboardType="number-pad" icon={ShieldCheck} accentColor={color} />
          </ProfileSection>
        )}

        {role === 'b2b' && (
          <>
            <ProfileSection title="Business Information" accentColor={color} icon={<Building2 size={17} color={color} />}>
              <ProfileField label="Company Name" value={companyName} onChangeText={setCompanyName} icon={Building2} accentColor={color} />
              <ProfileField label="Contact Person" value={contactPerson} onChangeText={setContactPerson} icon={User} accentColor={color} />
            </ProfileSection>
            <ProfileSection title="Fleet Information" accentColor={color} icon={<Car size={17} color={color} />}>
              <ProfileField label="Fleet Size" value={fleetSize} onChangeText={setFleetSize} keyboardType="number-pad" icon={Users} accentColor={color} />
            </ProfileSection>
          </>
        )}

        {role === 'driver' && (
          <ProfileSection title="Driving Information" accentColor={color} icon={<Car size={17} color={color} />}>
            <ProfileField label="Driving License Number" value={licenseNumber} onChangeText={setLicenseNumber} icon={ShieldCheck} accentColor={color} />
            <ProfileField label="Assigned Vehicle Reg." value={assignedVehicleReg} onChangeText={setAssignedVehicleReg} icon={Car} accentColor={color} />
          </ProfileSection>
        )}

        <TouchableOpacity style={[styles.save, { backgroundColor: color }]} disabled={saving} onPress={saveProfile}>
          {saving ? <ActivityIndicator color="#FFF" /> : <><Save size={18} color="#FFF" /><Text style={styles.saveText}>Save Changes</Text></>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06111F' },
  loading: { flex: 1, backgroundColor: '#06111F', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#94A3B8', marginTop: 10 },
  topBar: { minHeight: 68, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#17263A', flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#0D1B2D', alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#FFF', fontSize: 28, lineHeight: 30 },
  topTitle: { flex: 1, color: '#F8FAFC', fontSize: 19, fontWeight: '900' },
  scroll: { padding: 16, paddingTop: 18, paddingBottom: 30 },
  save: { height: 54, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 4 },
  saveText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
});
