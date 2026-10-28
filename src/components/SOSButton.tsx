import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { AlertOctagon } from 'lucide-react-native';
import { supabase } from '../supabaseClient'; 
import { useFakeShutdown } from './FakeShutdownProvider'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SOSButtonProps {
  userId: string; 
  currentLocation: { latitude: number; longitude: number } | null; 
  userRole: 'customer' | 'driver'; 
}

export default function SOSButton({ userId, currentLocation, userRole }: SOSButtonProps) {
  const { triggerFakeShutdown, isFakeShutdown } = useFakeShutdown();
  const [isSendingSOS, setIsSendingSOS] = useState(false);
  const [currentAlertId, setCurrentAlertId] = useState<string | null>(null);

  useEffect(() => {
    const loadSavedAlertId = async () => {
      const savedId = await AsyncStorage.getItem('active_sos_alert_id');
      if (savedId) setCurrentAlertId(savedId);
    };
    loadSavedAlertId();
  }, []);

  useEffect(() => {
    const checkAndResolveSOS = async () => {
      const savedId = await AsyncStorage.getItem('active_sos_alert_id');
      const activeId = currentAlertId || savedId;

      if (!isFakeShutdown && activeId) {
        try {
          await supabase
            .from('emergency_alerts')
            .update({ status: 'RESOLVED', resolved_at: new Date().toISOString() })
            .eq('id', activeId);
          
          await AsyncStorage.removeItem('active_sos_alert_id');
          setCurrentAlertId(null); 
        } catch (err) {
          console.error("Failed to resolve SOS:", err);
        }
      }
    };
    checkAndResolveSOS();
  }, [isFakeShutdown, currentAlertId]);

  const triggerSOSPanic = async () => {
    console.log("SOS triggered with UserId:", userId);
    if (isSendingSOS) return; 
    setIsSendingSOS(true);

    if (!currentLocation) {
      Alert.alert("Car Rescue BD", "জিপিএস লোকেশন লোড হচ্ছে...");
      setIsSendingSOS(false);
      return;
    }

    try {
      // UUID ভ্যালিডেশন (Supabase এর UUID ফরম্যাট চেক)
      const isValidUUID = (uuid: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid);
      
      if (!isValidUUID(userId)) {
        throw new Error("Invalid User ID format: Not a valid UUID");
      }

      // ড্রাইভার টেবিলে ইউজার নিশ্চিত করা (upsert ব্যবহার করে ফরেইন কি সমস্যা সমাধান)
      const { error: driverError } = await supabase
        .from('drivers')
        .upsert({ id: userId }, { onConflict: 'id' });

      if (driverError) {
        throw new Error("Drivers টেবিলে ইউজার যুক্ত করতে সমস্যা হয়েছে: " + driverError.message);
      }

      // SOS অ্যালার্ট ইনসার্ট
      const { data, error } = await supabase
        .from('emergency_alerts')
        .insert({
          driver_id: userId, 
          status: 'ACTIVE_PANIC',
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const alertId = data[0].id;
        setCurrentAlertId(alertId);
        await AsyncStorage.setItem('active_sos_alert_id', alertId);
      }

      // SMS পাঠানো
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        const mapLink = `https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`;
        const sosMessage = `🚨 Car Rescue BD জরুরী এলার্ট! ID: ${userId}. লোকেশন: ${mapLink}`;
        await SMS.sendSMSAsync(['999', '017XXXXXXXX'], sosMessage);
      }

      setTimeout(() => triggerFakeShutdown(), 4000);
      Alert.alert("সফল", "জরুরী অ্যালার্ট পাঠানো হয়েছে!");
      
    } catch (err) {
      console.error("SOS alert process failed:", err);
      Alert.alert("SOS ব্যর্থ", "সিস্টেম এরর হয়েছে। আইডি চেক করুন।");
    } finally {
      setIsSendingSOS(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.sosButton, isSendingSOS && { opacity: 0.7 }]} 
      onPress={triggerSOSPanic}
      disabled={isSendingSOS}
    >
      <AlertOctagon size={22} color="#FFF" />
      <Text style={styles.sosText}>{isSendingSOS ? 'পাঠানো হচ্ছে...' : 'SOS'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sosButton: {
    position: 'absolute', bottom: 30, right: 20,
    backgroundColor: '#EF4444', paddingVertical: 14, paddingHorizontal: 20,
    borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 8,
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 4,
  },
  sosText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
});