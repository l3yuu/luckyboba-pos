// src/components/IdleWrapper.tsx
import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import api from '../services/api';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const WARN_AT_MS      = 4 * 60 * 1000 + 30 * 1000; // warn at 4m30s

const IdleWrapper = () => {
  const navigate  = useNavigate();
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnedRef = useRef(false);

  const logout = useCallback(() => {
    localStorage.removeItem('token'); // 👈 change to your auth key if different
    navigate('/login');
  }, [navigate]);

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warnRef.current)  clearTimeout(warnRef.current);
    warnedRef.current = false;

    // Warn at 4m30s
    warnRef.current = setTimeout(() => {
      if (!warnedRef.current) {
        warnedRef.current = true;
        console.warn('[IdleTimeout] Logging out in 30 seconds due to inactivity.');
        // 👇 swap this with your toast if you have one e.g. toast.warning(...)
      }
    }, WARN_AT_MS);

    // Logout at 5m
    timerRef.current = setTimeout(logout, IDLE_TIMEOUT_MS);
  }, [logout]);

  useEffect(() => {
    // DOM activity events
    const events = ['mousemove', 'keydown', 'click', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetTimer));

    // API call activity
    const interceptor = api.interceptors.request.use((config) => {
      resetTimer();
      return config;
    });

    // Start timer on mount
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      api.interceptors.request.eject(interceptor);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warnRef.current)  clearTimeout(warnRef.current);
    };
  }, [resetTimer]);

  return <Outlet />;
};

export default IdleWrapper;