// src/hooks/useApiActivityTracker.ts
import { useEffect } from 'react';
import api from '../services/api'; // your axios instance

const useApiActivityTracker = (resetTimer: () => void) => {
  useEffect(() => {
    const interceptor = api.interceptors.request.use((config) => {
      resetTimer();
      return config;
    });

    return () => api.interceptors.request.eject(interceptor);
  }, [resetTimer]);
};

export default useApiActivityTracker;