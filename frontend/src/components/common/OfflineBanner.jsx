import { useState, useEffect } from 'react';
import { Alert } from '@mui/material';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOff = () => setOffline(true);
    const goOn = () => setOffline(false);
    window.addEventListener('offline', goOff);
    window.addEventListener('online', goOn);
    return () => {
      window.removeEventListener('offline', goOff);
      window.removeEventListener('online', goOn);
    };
  }, []);

  if (!offline) return null;

  return (
    <Alert severity="warning" sx={{ borderRadius: 0 }}>
      You appear to be offline. Some features may be unavailable.
    </Alert>
  );
}
