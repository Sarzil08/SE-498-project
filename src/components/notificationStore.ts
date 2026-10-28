import { AppRole } from './RoleBadge';

type Listener = () => void;
export type AppNotification = {
  id: string;
  role: AppRole;
  title: string;
  message: string;
  time: string;
  read: boolean;
  kind: 'service' | 'store' | 'system' | 'payment';
};

const listeners = new Set<Listener>();
const data: Record<AppRole, AppNotification[]> = {
  customer: [
    { id: 'c1', role: 'customer', title: 'Mechanic nearby', message: 'A verified mechanic is available 1.4 km away.', time: 'Just now', read: false, kind: 'service' },
    { id: 'c2', role: 'customer', title: 'Store offer', message: 'Popular brake pads are available near your area.', time: '18 min ago', read: false, kind: 'store' },
    { id: 'c3', role: 'customer', title: 'Payment received', message: 'Your previous roadside service payment was recorded.', time: 'Yesterday', read: true, kind: 'payment' },
  ],
  mechanic: [
    { id: 'm1', role: 'mechanic', title: 'New service request', message: 'A roadside assistance request is available nearby.', time: 'Just now', read: false, kind: 'service' },
    { id: 'm2', role: 'mechanic', title: 'Store order', message: 'A customer placed an order for one of your listed parts.', time: '32 min ago', read: false, kind: 'store' },
    { id: 'm3', role: 'mechanic', title: 'Profile status', message: 'Your mechanic profile is active.', time: 'Today', read: true, kind: 'system' },
  ],
  b2b: [
    { id: 'b1', role: 'b2b', title: 'Fleet alert', message: 'One fleet vehicle needs maintenance attention.', time: '12 min ago', read: false, kind: 'service' },
    { id: 'b2', role: 'b2b', title: 'Service report ready', message: 'A recent vehicle service report is available.', time: '1 hr ago', read: false, kind: 'system' },
    { id: 'b3', role: 'b2b', title: 'Subscription', message: 'Your business service package is active.', time: 'Yesterday', read: true, kind: 'payment' },
  ],
  driver: [
    { id: 'd1', role: 'driver', title: 'Duty update', message: 'Your live tracking mode is currently active.', time: 'Just now', read: false, kind: 'system' },
    { id: 'd2', role: 'driver', title: 'Parts available', message: 'Brake and battery parts are available nearby.', time: '25 min ago', read: false, kind: 'store' },
    { id: 'd3', role: 'driver', title: 'Service complete', message: 'Your last roadside assistance was completed.', time: 'Yesterday', read: true, kind: 'service' },
  ],
};

function notify() { listeners.forEach(l => l()); }

export function subscribeNotifications(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getNotifications(role: AppRole) {
  return data[role] || [];
}

export function getUnreadCount(role: AppRole) {
  return getNotifications(role).filter(n => !n.read).length;
}

export function markAllRead(role: AppRole) {
  data[role] = data[role].map(n => ({ ...n, read: true }));
  notify();
}

export function addNotification(notification: Omit<AppNotification, 'id' | 'read' | 'time'> & { time?: string }) {
  data[notification.role] = [
    { ...notification, id: `n-${Date.now()}`, read: false, time: notification.time || 'Just now' },
    ...data[notification.role],
  ];
  notify();
}
