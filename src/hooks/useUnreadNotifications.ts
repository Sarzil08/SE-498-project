import { useEffect, useState } from 'react';
import { AppRole } from '../components/RoleBadge';
import { getUnreadCount, subscribeNotifications } from '../components/notificationStore';

export function useUnreadNotifications(role: AppRole) {
  const [count, setCount] = useState(() => getUnreadCount(role));
  useEffect(() => {
    const refresh = () => setCount(getUnreadCount(role));
    refresh();
    return subscribeNotifications(refresh);
  }, [role]);
  return count;
}
