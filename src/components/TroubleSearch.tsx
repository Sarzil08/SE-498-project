import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ActivityIndicator, 
  FlatList, 
  Alert 
} from 'react-native';
import { Wrench, Disc, Battery, Search, User } from 'lucide-react-native';
import { supabase } from '../supabaseClient';

interface Mechanic {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  rating: number;
}

interface TroubleSearchProps {
  onMechanicSelect: (mechanic: Mechanic, selectedIssues: string[]) => void;
}

export default function TroubleSearch({ onMechanicSelect }: TroubleSearchProps) {
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mechanicsList, setMechanicsList] = useState<Mechanic[]>([]);

  // 🚗 সমস্যা সিলেক্ট করার টগল লজিক
  const toggleIssue = (issueId: string) => {
    if (selectedIssues.includes(issueId)) {
      setSelectedIssues(prev => prev.filter(id => id !== issueId));
    } else {
      setSelectedIssues(prev => [...prev, issueId]);
    }
  };

  // 🔍 সুপাবেস থেকে মেকানিক সার্চ করার ফাংশন
  const handleSearchMechanics = async () => {
    if (selectedIssues.length === 0) {
      Alert.alert("Car Rescue BD", "দয়া করে আপনার গাড়ির অন্তত একটি সমস্যা সিলেক্ট করুন।");
      return;
    }

    setIsSearching(true);
    setMechanicsList([]);

    try {
      // সুপাবেসের 'profiles' টেবিল থেকে অনলাইন মেকানিক খোঁজা
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, phone, specialty, rating')
        .eq('role', 'mechanic')
        .eq('is_online', true);

      if (error) throw error;

      // একটু রিয়ালিস্টিক ফিল দেওয়ার জন্য ১.৫ সেকেন্ড লোডিং স্পিনার দেখাব
      setTimeout(() => {
        if (data && data.length > 0) {
          setMechanicsList(data);
        } else {
          Alert.alert("দুঃখিত", "এই মুহূর্তে আপনার আশেপাশে কোনো মেকানিক অনলাইন নেই।");
        }
        setIsSearching(false);
      }, 1500);

    } catch (err: any) {
      Alert.alert("এরর", "মেকানিক খুঁজতে সমস্যা হয়েছে: " + err.message);
      setIsSearching(false);
    }
  };

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.headerTitle}>Car Rescue BD - সমস্যা নির্বাচন</Text>
      <Text style={styles.subTitle}>আপনার গাড়ির কী সমস্যা হচ্ছে সিলেক্ট করুন:</Text>

      {/* 🛠️ ৩টি কমন সমস্যা সিলেকশন বাটন */}
      <View style={styles.issuesRow}>
        <TouchableOpacity 
          style={[styles.issueBtn, selectedIssues.includes('engine') && styles.selectedBtn]} 
          onPress={() => toggleIssue('engine')}
        >
          <Wrench size={24} color={selectedIssues.includes('engine') ? '#0B0F19' : '#38BDF8'} />
          <Text style={[styles.issueText, selectedIssues.includes('engine') && styles.selectedText]}>ইঞ্জিন লক</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.issueBtn, selectedIssues.includes('tire') && styles.selectedBtn]} 
          onPress={() => toggleIssue('tire')}
        >
          <Disc size={24} color={selectedIssues.includes('tire') ? '#0B0F19' : '#38BDF8'} />
          <Text style={[styles.issueText, selectedIssues.includes('tire') && styles.selectedText]}>টায়ার পাংচার</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.issueBtn, selectedIssues.includes('battery') && styles.selectedBtn]} 
          onPress={() => toggleIssue('battery')}
        >
          <Battery size={24} color={selectedIssues.includes('battery') ? '#0B0F19' : '#38BDF8'} />
          <Text style={[styles.issueText, selectedIssues.includes('battery') && styles.selectedText]}>ডেড ব্যাটারি</Text>
        </TouchableOpacity>
      </View>

      {/* 🔍 সার্চ বাটন */}
      {!isSearching && mechanicsList.length === 0 && (
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearchMechanics}>
          <Search size={18} color="#0B0F19" />
          <Text style={styles.searchBtnText}>আশেপাশে মেকানিক খুঁজুন</Text>
        </TouchableOpacity>
      )}

      {/* 🔄 লোডিং স্পিনার */}
      {isSearching && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#38BDF8" />
          <Text style={{ color: '#9CA3AF', marginTop: 10 }}>কাছাকাছি মেকানিক খোঁজা হচ্ছে...</Text>
        </View>
      )}

      {/* 📋 মেকানিক লিস্ট রেজাল্ট ইউআই */}
      {mechanicsList.length > 0 && (
        <View style={{ marginTop: 15, maxHeight: 200 }}>
          <Text style={{ color: '#38BDF8', fontWeight: 'bold', marginBottom: 10 }}>আশেপাশের অনলাইন মেকানিকসমূহ:</Text>
          <FlatList
            data={mechanicsList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.mechanicRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <User size={20} color="#9CA3AF" />
                  <View>
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{item.name}</Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 12 }}>এক্সপার্ট: {item.specialty || 'সব কাজ'}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.requestBtn} 
                  onPress={() => onMechanicSelect(item, selectedIssues)}
                >
                  <Text style={{ color: '#0B0F19', fontWeight: 'bold', fontSize: 12 }}>রিকোয়েস্ট</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: { backgroundColor: '#1F2937', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#374151', width: '100%' },
  headerTitle: { color: '#38BDF8', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginBottom: 4 },
  subTitle: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginBottom: 15 },
  issuesRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 15 },
  issueBtn: { flex: 1, backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151', borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 8 },
  selectedBtn: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
  issueText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  selectedText: { color: '#0B0F19', fontWeight: 'bold' },
  searchBtn: { flexDirection: 'row', backgroundColor: '#38BDF8', height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 5 },
  searchBtnText: { color: '#0B0F19', fontWeight: 'bold', fontSize: 15 },
  loadingBox: { paddingVertical: 20, alignItems: 'center' },
  mechanicRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#374151' },
  requestBtn: { backgroundColor: '#38BDF8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }
});