// src/hooks/useIdleLogout.ts
import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useIdleTimeout from './useIdleTimeout';
import useApiActivityTracker from './useApiActivityTracker';

const useIdleLogout = () => {
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    navigate('/login');
  }, [navigate]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, 5 * 60 * 1000);
  }, [logout]);

  useIdleTimeout();
  useApiActivityTracker(resetTimer);
};

export default useIdleLogout;