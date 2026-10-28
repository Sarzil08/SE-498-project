import { DeviceEventEmitter, EmitterSubscription } from 'react-native';

export const ACCIDENT_SIGNAL_EVENT = 'car_rescue_bd_accident_signal';

export type AccidentRole = 'customer' | 'driver';

export interface AccidentSignal {
  signalId?: string;
  role: AccidentRole;
  userId?: string;
  personName: string;
  contactPhone?: string;
  vehicleInfo: string;
  vehicleId?: string;
  ownerPhone?: string;
  latitude?: number;
  longitude?: number;
  moving?: boolean;
  speedKmh?: number;
  testOnly?: boolean;
}

export function emitAccidentSignal(signal: AccidentSignal) {
  const payload = {
    ...signal,
    signalId: signal.signalId || `accident-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
  DeviceEventEmitter.emit(ACCIDENT_SIGNAL_EVENT, payload);
  return payload.signalId;
}

export function subscribeAccidentSignal(listener: (signal: AccidentSignal) => void): EmitterSubscription {
  return DeviceEventEmitter.addListener(ACCIDENT_SIGNAL_EVENT, listener);
}
