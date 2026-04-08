import { useState, useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';

export function useServiceWorker() {
  const [needsUpdate,  setNeedsUpdate]  = useState(false);
  const [updateFn,     setUpdateFn]     = useState<(() => void) | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        setNeedsUpdate(true);
        setUpdateFn(() => () => updateSW(true));
      },
      onOfflineReady() {
        setIsRegistered(true);
        console.log('[PWA] App ready for offline use.');
      },
      onRegisterError(error: unknown) {
        console.error('[PWA] Service worker registration failed:', error);
      },
    });
  }, []);

  const applyUpdate = () => {
    if (updateFn) {
      updateFn();
      setNeedsUpdate(false);
    }
  };

  return { needsUpdate, applyUpdate, isRegistered };
}