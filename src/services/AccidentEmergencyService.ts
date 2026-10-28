import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { supabase } from '../../supabaseClient';
import { OfflineManager } from '../../OfflineManager';
import {
  loadAccidentSettings,
  recordAccidentEvent,
  wasAccidentAlertSent,
  AccidentSettings,
} from './accidentSettingsStore';
import { AccidentSignal } from './AccidentSignalBridge';

const MOVEMENT_THRESHOLD_METERS = 15;
const CHECK_WINDOW_MS = 20_000;
const POLL_INTERVAL_MS = 2_000;
const NEARBY_MECHANIC_RADIUS_KM = 10;
const NEARBY_MECHANIC_LIMIT = 5;

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface MechanicRecipient {
  id?: string;
  name?: string;
  phone: string;
  latitude?: number;
  longitude?: number;
}

export type AccidentMonitorStatus =
  | { type: 'disabled'; message: string }
  | { type: 'monitoring'; remainingSeconds: number }
  | { type: 'cancelled'; message: string }
  | { type: 'test-complete'; message: string }
  | { type: 'sent'; recipients: number; message: string }
  | { type: 'no-recipients'; message: string }
  | { type: 'failed'; message: string };

function cleanPhone(value?: string) {
  return String(value || '').replace(/[^\d+]/g, '').trim();
}

function phoneKey(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('00880')) return digits.slice(2);
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('0')) return `880${digits.slice(1)}`;
  return digits;
}

function haversineMeters(a: Coordinate, b: Coordinate) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function currentPositionUrl(location: Coordinate) {
  return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
}

function getSignalLocation(signal: AccidentSignal, position?: Location.LocationObject): Coordinate | null {
  if (position?.coords) {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  }
  if (Number.isFinite(signal.latitude) && Number.isFinite(signal.longitude)) {
    return {
      latitude: Number(signal.latitude),
      longitude: Number(signal.longitude),
    };
  }
  return null;
}

async function tryGetCurrentLocation(): Promise<Coordinate | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch {
    return null;
  }
}

async function getNearbyMechanics(location: Coordinate): Promise<MechanicRecipient[]> {
  try {
    // The supplied project stores mechanic identity in mechanic_profiles/profiles
    // and live coordinates in vehicle_locations, so join those existing sources
    // client-side rather than inventing latitude/name columns on mechanic_profiles.
    const [{ data: profiles, error: profileError }, { data: locations, error: locationError }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, mobile_number, role')
        .eq('role', 'mechanic')
        .limit(100),
      supabase
        .from('vehicle_locations')
        .select('driver_id, latitude, longitude, updated_at')
        .limit(200),
    ]);

    if (!profileError && !locationError && Array.isArray(profiles) && Array.isArray(locations)) {
      const locationMap = new Map<string, any>();
      for (const row of locations) {
        if (!row?.driver_id) continue;
        const lat = Number(row.latitude);
        const lng = Number(row.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          const existing = locationMap.get(String(row.driver_id));
          if (!existing || String(row.updated_at || '') > String(existing.updated_at || '')) {
            locationMap.set(String(row.driver_id), row);
          }
        }
      }

      const mapped = profiles
        .map(profile => {
          const live = locationMap.get(String(profile.id));
          if (!live || !profile.mobile_number) return null;
          const coordinate = { latitude: Number(live.latitude), longitude: Number(live.longitude) };
          return {
            id: String(profile.id),
            name: profile.full_name ? String(profile.full_name) : 'Mechanic',
            phone: cleanPhone(profile.mobile_number),
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            distance: haversineMeters(location, coordinate),
          };
        })
        .filter(Boolean)
        .filter((row: any) => row.phone && row.distance <= NEARBY_MECHANIC_RADIUS_KM * 1000)
        .sort((a: any, b: any) => a.distance - b.distance)
        .slice(0, NEARBY_MECHANIC_LIMIT);

      return mapped as MechanicRecipient[];
    }
  } catch (error) {
    console.log('Online mechanic lookup failed:', error);
  }

  try {
    OfflineManager.initDatabase();
    const cached = OfflineManager.getOfflineMechanics() as any[];
    return cached
      .filter(row => row?.phone && Number.isFinite(Number(row.latitude)) && Number.isFinite(Number(row.longitude)))
      .map(row => ({
        id: String(row.id || ''),
        name: row.name ? String(row.name) : 'Mechanic',
        phone: cleanPhone(row.phone),
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        distance: haversineMeters(location, { latitude: Number(row.latitude), longitude: Number(row.longitude) }),
      }))
      .filter((row: any) => row.distance <= NEARBY_MECHANIC_RADIUS_KM * 1000)
      .sort((a: any, b: any) => a.distance - b.distance)
      .slice(0, NEARBY_MECHANIC_LIMIT);
  } catch {
    return [];
  }
}

function buildMessage(signal: AccidentSignal, location: Coordinate) {
  const roleLabel = signal.role === 'driver' ? 'Driver' : 'Customer';
  const mapUrl = currentPositionUrl(location);
  return [
    '[CAR RESCUE BD - ACCIDENT ALERT]',
    'No movement detected for 20 seconds.',
    `${roleLabel}: ${signal.personName}`,
    `Contact: ${signal.contactPhone || 'Not provided'}`,
    `Vehicle: ${signal.vehicleInfo}`,
    `Location: ${mapUrl}`,
    'Please check the vehicle and contact the person immediately.',
  ].join('\n');
}

function addRecipient(targets: string[], value?: string) {
  const phone = cleanPhone(value);
  if (!phone) return;
  const key = phoneKey(phone);
  if (!key || targets.some(existing => phoneKey(existing) === key)) return;
  targets.push(phone);
}

async function sendViaSupabaseFunction(recipients: string[], message: string) {
  if (!recipients.length) return { success: false, message: 'No recipients.' };

  try {
    const { data, error } = await supabase.functions.invoke('send-accident-sms', {
      body: { recipients, message },
    });
    if (!error && data?.success) {
      return { success: true, mode: 'server' } as const;
    }
    return { success: false, mode: 'server', message: error?.message || 'Edge Function unavailable.' } as const;
  } catch (error: any) {
    return { success: false, mode: 'server', message: error?.message || 'Edge Function failed.' } as const;
  }
}

async function fallbackToSmsComposer(recipients: string[], message: string) {
  try {
    const available = await SMS.isAvailableAsync();
    if (!available) return { success: false, message: 'SMS service is not available on this device.' };
    const result = await SMS.sendSMSAsync(recipients, message);
    return { success: true, mode: 'composer', result } as const;
  } catch (error: any) {
    return { success: false, message: error?.message || 'SMS composer failed.' };
  }
}

async function loadMonitoringLocation(signal: AccidentSignal): Promise<Coordinate | null> {
  const signalLocation = getSignalLocation(signal);
  if (signalLocation) return signalLocation;
  return tryGetCurrentLocation();
}

export async function startAccidentMonitoring(
  signal: AccidentSignal,
  onStatus?: (status: AccidentMonitorStatus) => void,
) {
  if (signal.role !== 'customer' && signal.role !== 'driver') return;

  const settings: AccidentSettings = loadAccidentSettings(signal.role, signal.userId);
  if (!settings.enabled && !signal.testOnly) {
    onStatus?.({ type: 'disabled', message: 'Accident alert is turned off in Settings.' });
    return;
  }

  const signalId = signal.signalId || `accident-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  if (wasAccidentAlertSent(signalId)) return;

  const startLocation = await loadMonitoringLocation(signal);
  if (!startLocation) {
    recordAccidentEvent(signalId, signal.role, signal.userId, 'failed');
    onStatus?.({ type: 'failed', message: 'Could not confirm the vehicle location, so the automatic alert was not sent.' });
    return;
  }

  recordAccidentEvent(signalId, signal.role, signal.userId, 'monitoring');

  let lastLocation = startLocation;
  let cancelled = false;
  let elapsed = 0;
  let haveMotionEvidence = signal.moving !== undefined || signal.speedKmh !== undefined;

  onStatus?.({ type: 'monitoring', remainingSeconds: 20 });

  while (elapsed < CHECK_WINDOW_MS) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    elapsed += POLL_INTERVAL_MS;

    if (signal.moving === true || Number(signal.speedKmh || 0) > 1) {
      cancelled = true;
    }

    const latest = await tryGetCurrentLocation();
    if (latest) {
      haveMotionEvidence = true;
      lastLocation = latest;
      try {
        await supabase.from('vehicle_locations').upsert({
          driver_id: signal.vehicleId || signal.userId || `${signal.role}-vehicle`,
          latitude: latest.latitude,
          longitude: latest.longitude,
          updated_at: new Date().toISOString(),
        });
      } catch {
        // The alert flow should not fail just because live-location sync failed.
      }

      if (haversineMeters(startLocation, latest) >= MOVEMENT_THRESHOLD_METERS) {
        cancelled = true;
      }
    } else if (signal.moving === false) {
      // Hardware can explicitly tell us the vehicle is stationary.
    }

    if (cancelled) {
      recordAccidentEvent(signalId, signal.role, signal.userId, 'cancelled');
      onStatus?.({
        type: 'cancelled',
        message: 'Vehicle movement detected within 20 seconds. Automatic SMS cancelled.',
      });
      return;
    }

    const remaining = Math.max(0, Math.ceil((CHECK_WINDOW_MS - elapsed) / 1000));
    onStatus?.({ type: 'monitoring', remainingSeconds: remaining });
  }

  if (!haveMotionEvidence) {
    recordAccidentEvent(signalId, signal.role, signal.userId, 'failed');
    onStatus?.({
      type: 'failed',
      message: 'Movement could not be verified for the 20-second window, so the automatic SMS was not sent.',
    });
    return;
  }

  if (signal.testOnly) {
    recordAccidentEvent(signalId, signal.role, signal.userId, 'test-complete');
    onStatus?.({
      type: 'test-complete',
      message: '20-second accident test completed. No SMS was sent.',
    });
    return;
  }

  const recipients: string[] = [];
  addRecipient(recipients, settings.sendEmergencyContact ? settings.emergencyPhone : undefined);
  addRecipient(recipients, settings.sendOwner ? settings.ownerPhone : undefined);

  if (settings.sendNearbyMechanics) {
    const nearby = await getNearbyMechanics(lastLocation);
    nearby.forEach(mechanic => addRecipient(recipients, mechanic.phone));
  }

  if (!recipients.length) {
    recordAccidentEvent(signalId, signal.role, signal.userId, 'no-recipients');
    onStatus?.({
      type: 'no-recipients',
      message: 'No SMS recipient is configured. Add an emergency/owner contact in Settings.',
    });
    return;
  }

  const message = buildMessage(signal, lastLocation);
  const serverResult = await sendViaSupabaseFunction(recipients, message);
  if (serverResult.success) {
    recordAccidentEvent(signalId, signal.role, signal.userId, 'sent');
    onStatus?.({
      type: 'sent',
      recipients: recipients.length,
      message: 'Automatic accident SMS sent.',
    });
    return;
  }

  // Expo SMS is a fallback composer, not a silent background SMS sender.
  const fallback = await fallbackToSmsComposer(recipients, message);
  if (fallback.success) {
    recordAccidentEvent(signalId, signal.role, signal.userId, 'sent');
    onStatus?.({
      type: 'sent',
      recipients: recipients.length,
      message: 'SMS composer opened because the server SMS provider is not configured.',
    });
    return;
  }

  recordAccidentEvent(signalId, signal.role, signal.userId, 'failed');
  onStatus?.({
    type: 'failed',
    message: 'Automatic SMS failed. Configure the Supabase SMS function/provider for silent server-side sending.',
  });
}
