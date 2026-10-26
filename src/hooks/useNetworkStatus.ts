import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

// Simple network check via fetch ping.
// Does not require NetInfo package.
const PING_URL = 'https://api.jamendo.com/v3.0/tracks?client_id=ping&format=json&limit=1';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  const check = async () => {
    try {
      const res = await fetch(PING_URL, { method: 'HEAD' });
      setIsOnline(res.ok || res.status < 500);
    } catch {
      setIsOnline(false);
    }
  };

  useEffect(() => {
    check();

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') check();
    });

    const interval = setInterval(check, 30_000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, []);

  return { isOnline };
}
