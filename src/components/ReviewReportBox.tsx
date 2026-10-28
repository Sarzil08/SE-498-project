import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { Star, MessageSquare, AlertTriangle } from 'lucide-react-native';
import { supabase } from '../supabaseClient';

interface ReviewReportBoxProps {
  requestId: string;
  fromUserId: string;
  toUserId: string;
  userRole: 'customer' | 'driver' | 'fleet_owner';
  onComplete: () => void;
}

export default function ReviewReportBox({ 
  requestId, 
  fromUserId, 
  toUserId, 
  userRole, 
  onComplete 
}: ReviewReportBoxProps) {
  const [rating, setRating] = useState(5);
  const [comment, setReviewComment] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [loading, setLoading] = useState(false);

  // ⭐ রিভিউ ও রেটিং সাবমিট করার ফাংশন
  const handleSubmitReview = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        request_id: requestId,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        rating: rating,
        comment: comment,
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      Alert.alert("Car Rescue BD", "আপনার মূল্যবান রিভিউ ও রেটিং সফলভাবে জমা হয়েছে।");
      onComplete(); // ড্যাশবোর্ড স্ক্রিনকে রিসেট করার কলব্যাক
    } catch (err: any) {
      Alert.alert("দুঃখিত", "রিভিউ জমা দেওয়া যায়নি: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ⚠️ অ্যাডমিনের কাছে কমপ্লেন/রিপোর্ট পাঠানোর ফাংশন
  const handleCalculateReport = async () => {
    if (!reportReason.trim()) {
      Alert.alert("Car Rescue BD", "দয়া করে রিপোর্টের কারণটি লিখুন।");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('reports').insert({
        request_id: requestId,
        reporter_id: fromUserId,
        reported_id: toUserId,
        reason: reportReason,
        role_context: userRole,
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      Alert.alert("রিপোর্ট জমা হয়েছে", "অ্যাডমিন প্যানেল খুব দ্রুত এই বিষয়টি খতিয়ে দেখবে।");
      setReportReason('');
      setIsReporting(false);
    } catch (err: any) {
      Alert.alert("দুঃখিত", "রিপোর্ট সাবমিট করা যায়নি: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.reviewCard}>
      {!isReporting ? (
        <>
          {/* 🌟 রেটিং ও রিভিউ সেকশন */}
          <Text style={styles.titleText}>
            {userRole === 'customer' ? 'মেকানিককে' : 'ইউজারকে'} রেটিং ও মন্তব্য দিন
          </Text>
          
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Star 
                  size={32} 
                  color={star <= rating ? '#F59E0B' : '#4B5563'} 
                  fill={star <= rating ? '#F59E0B' : 'transparent'} 
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput 
            style={styles.reviewInput} 
            value={comment} 
            onChangeText={setReviewComment} 
            placeholder="আপনার অভিজ্ঞতা এখানে লিখুন..." 
            placeholderTextColor="#64748B"
            multiline
          />

          <TouchableOpacity style={styles.submitReviewBtn} onPress={handleSubmitReview} disabled={loading}>
            {loading ? <ActivityIndicator color="#0B0F19" /> : (
              <>
                <MessageSquare size={16} color="#0B0F19" />
                <Text style={styles.btnText}>রিভিউ সাবমিট করুন</Text>
              </>
            )}
          </TouchableOpacity>

          {/* 🚩 রিপোর্ট করার টগল বাটন */}
          <TouchableOpacity style={styles.toggleReportBtn} onPress={() => setIsReporting(true)}>
            <AlertTriangle size={14} color="#EF4444" />
            <Text style={styles.toggleReportText}>কোনো সমস্যা হয়েছে? রিপোর্ট করুন</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* 🚩 রিপোর্ট/কমপ্লেন ফরম সেকশন */}
          <Text style={[styles.titleText, { color: '#EF4444' }]}>⚠️ কমপ্লেন/রিপোর্ট ফরম</Text>
          <Text style={styles.subText}>খারাপ আচরণ, অতিরিক্ত বিল বা অন্য কোনো অভিযোগ থাকলে নিচে বিস্তারিত লিখুন:</Text>

          <TextInput 
            style={[styles.reviewInput, { height: 80, borderColor: '#EF444455' }]} 
            value={reportReason} 
            onChangeText={setReportReason} 
            placeholder="অভিযোগের কারণ এখানে লিখুন..." 
            placeholderTextColor="#64748B"
            multiline
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.submitReviewBtn, { backgroundColor: '#EF4444', flex: 1 }]} onPress={handleCalculateReport} disabled={loading}>
              <Text style={styles.btnText}>রিপোর্ট পাঠান</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.submitReviewBtn, { backgroundColor: '#334155', flex: 1 }]} onPress={() => setIsReporting(false)}>
              <Text style={[styles.btnText, { color: '#FFF' }]}>ফিরে যান</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  reviewCard: { backgroundColor: '#1F2937', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#374151', gap: 10 },
  titleText: { color: '#38BDF8', fontWeight: 'bold', fontSize: 15, marginBottom: 5, textAlign: 'center' },
  subText: { color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginBottom: 5, lineHeight: 16 },
  starContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 10 },
  reviewInput: { backgroundColor: '#111827', borderRadius: 12, padding: 12, color: '#FFF', height: 70, textAlignVertical: 'top', borderWidth: 1, borderColor: '#374151', marginBottom: 5 },
  submitReviewBtn: { flexDirection: 'row', backgroundColor: '#38BDF8', height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 6 },
  btnText: { color: '#0B0F19', fontWeight: 'bold' },
  toggleReportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: '#334155' },
  toggleReportText: { color: '#EF4444', fontSize: 12, fontWeight: '600' }
});