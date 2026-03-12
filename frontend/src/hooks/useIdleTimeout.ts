// src/hooks/useIdleTimeout.ts
import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const useIdleTimeout = () => {
  const navigate   = useNavigate();
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem('token'); // adjust to match your auth storage key
    navigate('/login');
  }, [navigate]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, IDLE_TIMEOUT_MS);
  }, [logout]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'touchstart'];

    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer(); // start timer on mount

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);
};

export default useIdleTimeout;