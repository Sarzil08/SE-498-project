import React from 'react';
import { StyleSheet, Text, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, DollarSign, Users, Activity, Briefcase } from 'lucide-react-native';
import { StatCard } from '../components';

export default function AdminRevenue({ navigation }: any) {
  const handleLogout = () => {
    navigation.replace('AuthScreen');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>এডমিন প্যানেল 🛡️</Text>
          <Text style={styles.headerSub}>সিস্টেম রেভিনিউ সেন্ট্রাল</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color="#F8FAFC" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>আজকের ওভারভিউ (Today's Overview)</Text>

        <View style={styles.grid}>
          <StatCard label="সর্বমোট আয়" value="৳ ৮,৪০০" icon={<DollarSign size={20} color="#10B981" />} accentColor="#10B981" />
          <StatCard label="নতুন গ্রাহক সাবস্ক্রিপশন" value="২৪" icon={<Users size={20} color="#3B82F6" />} accentColor="#3B82F6" />
          <StatCard label="সফল রেসকিউ" value="৬৭" icon={<Activity size={20} color="#F59E0B" />} accentColor="#F59E0B" />
          <StatCard label="নতুন B2B ক্লায়েন্ট" value="২" icon={<Briefcase size={20} color="#8B5CF6" />} accentColor="#8B5CF6" />
        </View>

        <View style={styles.chartMockup}>
          <Text style={styles.chartTitle}>সাপ্তাহিক গ্রোথ চার্ট</Text>
          <View style={styles.chartArea}>
            <Text style={styles.chartText}>📊 [রেভিনিউ চার্ট ক্যানভাস এরিয়া]</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: '#1E293B', borderBottomWidth: 1, borderColor: '#334155'
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC' },
  headerSub: { fontSize: 13, color: '#EF4444', fontWeight: 'bold', marginTop: 2 },
  logoutBtn: { padding: 8, backgroundColor: '#334155', borderRadius: 8 },
  scroll: { padding: 20 },
  sectionTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#1E293B', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  iconWrapper: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#94A3B8' },
  chartMockup: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
  chartTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: 'bold', marginBottom: 16 },
  chartArea: { height: 180, backgroundColor: '#0F172A', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed' },
  chartText: { color: '#64748B', fontSize: 13 }
});
