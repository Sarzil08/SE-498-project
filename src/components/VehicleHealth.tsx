import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ShieldCheck, ChevronDown, ChevronUp, Activity } from 'lucide-react-native';

// 🛠️ টাইপস্ক্রিপ্ট ইন্টারফেস ডিক্লেয়ার করা হলো
interface VehicleHealthProps {
  driverId: string;
}

export default function VehicleHealth({ driverId }: VehicleHealthProps) {
  // ESP32 থেকে আসা সেন্সর ডাটার ডামি স্টেট (প্রয়োজনে driverId দিয়ে Supabase থেকে ডাটা ফেচ করতে পারো)
  const [healthData, setHealthData] = useState({
    engineTemp: 88, // °C
    batteryVoltage: 12.6, // V
    fuelLevel: 65, // %
    engineStatus: 'Good',
  });

  // ভেহিকেল হেলথ সেকশন দেখানোর টগল স্টেট
  const [showVehicleHealth, setShowVehicleHealth] = useState(false);

  // স্ট্যাটাস ডায়াগনোসিস ফাংশন
  const getTempStatus = (temp: number) => {
    if (temp > 100) return { label: 'High Warning', color: '#e74c3c' };
    if (temp > 90) return { label: 'Moderate', color: '#f39c12' };
    return { label: 'Normal', color: '#2ecc71' };
  };

  const getBatteryStatus = (volts: number) => {
    if (volts < 11.8) return { label: 'Low Battery', color: '#e74c3c' };
    return { label: 'Optimal', color: '#2ecc71' };
  };

  const tempInfo = getTempStatus(healthData.engineTemp);
  const batteryInfo = getBatteryStatus(healthData.batteryVoltage);

  return (
    <View style={styles.container}>
      {/* ভেহিকেল হেলথ স্ট্যাটাস দেখানোর আলাদা বাটন (টগল) */}
      <TouchableOpacity 
        style={styles.mainHealthBtn} 
        onPress={() => setShowVehicleHealth(!showVehicleHealth)}
        activeOpacity={0.85}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Activity size={20} color="#FFF" />
          <Text style={styles.mainHealthBtnText}>ভেহিকেল হেলথ স্ট্যাটাস দেখুন</Text>
        </View>
        {showVehicleHealth ? <ChevronUp size={20} color="#FFF" /> : <ChevronDown size={20} color="#FFF" />}
      </TouchableOpacity>

      {/* বাটনে চাপ দেওয়ার পর নিচের হেলথ ড্যাশবোর্ড শো করবে */}
      {showVehicleHealth && (
        <View style={{ marginTop: 12 }}>
          {/* Overall Health Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Overall Engine Condition</Text>
            <Text style={[styles.statusText, { color: '#2ecc71' }]}>
              {healthData.engineStatus}
            </Text>
          </View>

          {/* Engine Temperature Card */}
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>Engine Temperature</Text>
              <Text style={[styles.badge, { backgroundColor: tempInfo.color }]}>
                {tempInfo.label}
              </Text>
            </View>
            <Text style={styles.valueText}>{healthData.engineTemp} °C</Text>
          </View>

          {/* Battery Voltage Card */}
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>Battery Voltage</Text>
              <Text style={[styles.badge, { backgroundColor: batteryInfo.color }]}>
                {batteryInfo.label}
              </Text>
            </View>
            <Text style={styles.valueText}>{healthData.batteryVoltage} V</Text>
          </View>

          {/* Fuel / Oil Level Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fuel Level</Text>
            <Text style={styles.valueText}>{healthData.fuelLevel}%</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  mainHealthBtn: { 
    backgroundColor: '#1f6feb', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderRadius: 12, 
    shadowColor: '#1f6feb', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 6, 
    elevation: 4,
  },
  mainHealthBtnText: { 
    color: '#FFF', 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  card: {
    backgroundColor: '#161b22',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    color: '#8b949e',
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 6,
  },
  valueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 6,
  },
  badge: {
    color: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
});