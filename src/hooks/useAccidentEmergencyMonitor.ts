import { useEffect } from 'react';
import { Alert } from 'react-native';
import { subscribeAccidentSignal, AccidentSignal } from '../services/AccidentSignalBridge';
import { startAccidentMonitoring } from '../services/AccidentEmergencyService';

export function useAccidentEmergencyMonitor(defaultSignal: Omit<AccidentSignal, 'role' | 'personName' | 'vehicleInfo'> & {
  role: 'customer' | 'driver';
  personName: string;
  vehicleInfo: string;
}) {
  useEffect(() => {
    const subscription = subscribeAccidentSignal(async signal => {
      if (signal.role !== defaultSignal.role) return;

      const merged: AccidentSignal = {
        ...defaultSignal,
        ...signal,
        role: defaultSignal.role,
        userId: signal.userId || defaultSignal.userId,
        personName: signal.personName || defaultSignal.personName,
        vehicleInfo: signal.vehicleInfo || defaultSignal.vehicleInfo,
      };

      await startAccidentMonitoring(merged, status => {
        if (status.type === 'cancelled' || status.type === 'sent' || status.type === 'test-complete' || status.type === 'no-recipients' || status.type === 'failed' || status.type === 'disabled') {
          const title = status.type === 'sent'
            ? 'Accident Alert'
            : status.type === 'test-complete'
              ? 'Accident Test'
              : status.type === 'cancelled'
                ? 'Accident Alert Cancelled'
                : 'Accident Alert';
          Alert.alert(title, status.message);
        }
      });
    });

    return () => subscription.remove();
  }, [defaultSignal.role, defaultSignal.personName, defaultSignal.vehicleInfo, defaultSignal.userId, defaultSignal.contactPhone, defaultSignal.vehicleId]);
}
