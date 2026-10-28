import { AppRole } from './RoleBadge';

type Listener = () => void;
export type ServiceHistoryItem = {
  id: string;
  role: AppRole;
  title: string;
  date: string;
  partner: string;
  amount: string;
  status: 'completed' | 'cancelled' | 'pending';
  vehicle?: string;
  location?: string;
  rating?: number;
};

const listeners = new Set<Listener>();
const seed: Record<AppRole, ServiceHistoryItem[]> = {
  customer: [
    { id: 'c-h1', role: 'customer', title: 'Engine overheating assistance', date: '11 Sep 2026', partner: 'আব্দুর রহিম', amount: '৳900', status: 'completed', vehicle: 'Toyota Axio', location: 'Dhaka' },
    { id: 'c-h2', role: 'customer', title: 'Flat tyre replacement', date: '02 Sep 2026', partner: 'Karim Motors', amount: '৳650', status: 'completed', vehicle: 'Toyota Axio', location: 'Mirpur' },
    { id: 'c-h3', role: 'customer', title: 'Battery jump start', date: '29 Aug 2026', partner: 'Rahim Auto Care', amount: '৳450', status: 'completed', vehicle: 'Toyota Axio', location: 'Uttara' },
  ],
  mechanic: [
    { id: 'm-h1', role: 'mechanic', title: 'Engine overheating repair', date: '11 Sep 2026', partner: 'Customer #1021', amount: '৳900', status: 'completed', vehicle: 'Toyota Axio', location: 'Dhaka', rating: 5 },
    { id: 'm-h2', role: 'mechanic', title: 'Brake pad replacement', date: '08 Sep 2026', partner: 'Customer #1018', amount: '৳1,500', status: 'completed', vehicle: 'Honda Vezel', location: 'Mirpur', rating: 4.8 },
  ],
  b2b: [
    { id: 'b-h1', role: 'b2b', title: 'Fleet maintenance', date: '12 Sep 2026', partner: 'Rahim Motors', amount: '৳7,800', status: 'completed', vehicle: 'Fleet X-12', location: 'Dhaka' },
    { id: 'b-h2', role: 'b2b', title: 'AC service', date: '04 Sep 2026', partner: 'Car Rescue BD', amount: '৳2,800', status: 'completed', vehicle: 'Cargo Van Y-04', location: 'Tejgaon' },
  ],
  driver: [
    { id: 'd-h1', role: 'driver', title: 'Engine overheating assistance', date: '11 Sep 2026', partner: 'আব্দুর রহিম', amount: '৳900', status: 'completed', vehicle: 'Delivery Truck X-12', location: 'Dhaka' },
    { id: 'd-h2', role: 'driver', title: 'Tyre replacement', date: '06 Sep 2026', partner: 'Karim Motors', amount: '৳450', status: 'completed', vehicle: 'Delivery Truck X-12', location: 'Savar' },
  ],
};

const history: Record<AppRole, ServiceHistoryItem[]> = {
  customer: [...seed.customer],
  mechanic: [...seed.mechanic],
  b2b: [...seed.b2b],
  driver: [...seed.driver],
};

function notify() { listeners.forEach(l => l()); }
export function subscribeServiceHistory(listener: Listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function getServiceHistory(role: AppRole) { return history[role] || []; }
export function addServiceHistory(item: Omit<ServiceHistoryItem, 'id'>) {
  history[item.role] = [{ ...item, id: `h-${Date.now()}` }, ...history[item.role]];
  notify();
}
