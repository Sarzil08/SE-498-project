import * as SQLite from 'expo-sqlite';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { supabase } from './supabaseClient';

const db = SQLite.openDatabaseSync('offline_assistance.db');

export const OfflineManager = {
  initDatabase: () => {
    try {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS route_mechanics (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          specialty TEXT
        );
      `);
    } catch (error) {
      console.error('Offline database initialization failed:', error);
    }
  },

  // Build the local mechanic cache from the existing project tables:
  // profiles -> identity/contact, vehicle_locations -> latest location.
  downloadRouteData: async (_companyId: string) => {
    try {
      OfflineManager.initDatabase();
      const [{ data: profiles, error: profileError }, { data: locations, error: locationError }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, mobile_number, role')
          .eq('role', 'mechanic'),
        supabase
          .from('vehicle_locations')
          .select('driver_id, latitude, longitude, updated_at')
          .limit(200),
      ]);

      if (profileError) throw profileError;
      if (locationError) throw locationError;

      const latestLocations = new Map<string, any>();
      (locations || []).forEach((row: any) => {
        if (!row?.driver_id) return;
        const existing = latestLocations.get(String(row.driver_id));
        if (!existing || String(row.updated_at || '') > String(existing.updated_at || '')) latestLocations.set(String(row.driver_id), row);
      });

      db.execSync('DELETE FROM route_mechanics;');
      let count = 0;
      for (const profile of profiles || []) {
        const location = latestLocations.get(String(profile.id));
        if (!location || !profile.mobile_number) continue;
        db.runSync(
          'INSERT INTO route_mechanics (id, name, phone, latitude, longitude, specialty) VALUES (?, ?, ?, ?, ?, ?);',
          [
            String(profile.id),
            String(profile.full_name || 'Mechanic'),
            String(profile.mobile_number),
            Number(location.latitude),
            Number(location.longitude),
            'General',
          ],
        );
        count += 1;
      }
      return { success: true, count };
    } catch (error: any) {
      console.error('Failed to download route data:', error);
      return { success: false, error: error?.message || String(error) };
    }
  },

  getOfflineMechanics: () => {
    try {
      OfflineManager.initDatabase();
      return db.getAllSync('SELECT * FROM route_mechanics;');
    } catch (error) {
      console.error('Failed to fetch offline mechanics:', error);
      return [];
    }
  },

  sendEmergencySMS: async (targetPhone: string, driverName: string, vehicleInfo: string) => {
    try {
      let locationText = 'Location unknown (GPS unavailable)';
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        locationText = `Location: https://www.google.com/maps/search/?api=1&query=${location.coords.latitude},${location.coords.longitude}`;
      }

      const messageBody = `[SOS - OFFLINE EMERGENCY]\nDriver/Customer: ${driverName}\nVehicle: ${vehicleInfo}\n${locationText}\nNeed immediate roadside assistance!`;
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) return { success: false, message: 'SMS service is not available on this device.' };

      const { result } = await SMS.sendSMSAsync([targetPhone], messageBody);
      return { success: true, result };
    } catch (error: any) {
      console.error('SMS sending failed:', error);
      return { success: false, error: error?.message || String(error) };
    }
  },
};
