<<<<<<< HEAD
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
=======
"use client"

import api from '../services/api';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import type { LoginCredentials, User } from '../types/user';

// ─── Storage Strategy ──────────────────────────────────────────────────────────
//
// ROOT CAUSE OF THE LOCALHOST LOGOUT BUG:
//
// sessionStorage clears on:
//   ✗ Page refresh (F5 / Ctrl+R)          ← happens constantly in dev
//   ✗ Tab close / reopen
//   ✗ Opening a new tab to the same URL
//
// localStorage persists until explicitly cleared — which is why prod "worked":
// you weren't refreshing as often. On localhost you refresh constantly, so
// sessionStorage wiped your token every time.
//
// FIX: Use localStorage for auth persistence.
// The token itself is already short-lived and validated server-side via Sanctum.
// The "auto-clear on tab close" behavior of sessionStorage is not needed here
// because your /logout route + 401 interceptor already handle invalidation.
//
// If you still want POS terminals to auto-clear on close, set an
// inactivity timeout instead (see bottom of this file).

const storage = {
  get: (key: string) => localStorage.getItem(key),
  set: (key: string, val: string) => localStorage.setItem(key, val),
  remove: (key: string) => localStorage.removeItem(key),
};

const AUTH_KEYS = [
  'lucky_boba_token',
  'lucky_boba_authenticated',
  'lucky_boba_user_name',
  'lucky_boba_user_role',
];

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState<boolean>(
    () => !storage.get('lucky_boba_token')
  );
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(() => {
    const token = storage.get('lucky_boba_token');
    const name = storage.get('lucky_boba_user_name');
    const role = storage.get('lucky_boba_user_role');
    if (token && name) {
      return { name, role: role || 'cashier' } as User;
    }
    return null;
  });

  const clearSession = useCallback(() => {
    AUTH_KEYS.forEach(key => storage.remove(key));
    setUser(null);
  }, []);

  const checkAuth = useCallback(async (): Promise<User | null> => {
    const token = storage.get('lucky_boba_token');

    if (!token) {
      setIsLoading(false);
      return null;
    }

    try {
      const response = await api.get('/user');
      const userData = response.data;

      storage.set('lucky_boba_user_name', userData.name);
      storage.set('lucky_boba_user_role', userData.role || 'cashier');

      setUser(userData);
      return userData;
    } catch {
      clearSession();
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          clearSession();
        }
        return Promise.reject(error);
      }
    );

    checkAuth();

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [checkAuth, clearSession]);

  const login = async (credentials: LoginCredentials): Promise<User | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/login', credentials);
      if (response.data.success === false) {
        throw new Error(response.data.message || 'Invalid credentials.');
      }

      const { token, user: userData } = response.data;

      storage.set('lucky_boba_token', token);
      storage.set('lucky_boba_authenticated', 'true');
      storage.set('lucky_boba_user_name', userData.name);
      storage.set('lucky_boba_user_role', userData.role || 'cashier');

      setUser(userData);
      setIsLoading(false);
      return userData;

    } catch (err: unknown) {
      clearSession();

      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setError('Unable to connect. Please try again later.');
        } else if (err.response.status === 429) {
          const retryAfter = err.response.headers['retry-after'];
          const seconds = retryAfter ? parseInt(retryAfter) : 120;
          const minutes = Math.ceil(seconds / 60);
          setError(`Too many attempts. Please wait ${minutes} minute(s).`);
        } else {
          setError(err.response.data?.message || 'Invalid credentials.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }

<<<<<<< HEAD
    return { login, logout, isLoading, error, user };
>>>>>>> 999e1ca (refactor: update authentication flow to use sessionStorage, enhance token management, and improve security settings)
};
=======
      setIsLoading(false);
      return null;
    }
  };

  const logout = async (): Promise<boolean> => {
    try {
      await api.post('/logout');
      return true;
    } catch {
      return false;
    } finally {
      clearSession();
    }
  };

  return { login, logout, isLoading, error, user };
};

// ─── Optional: POS Inactivity Auto-Logout ─────────────────────────────────────
//
// If you want terminals to auto-logout after inactivity instead of on tab close,
// add this hook and call it inside your root layout component:
//
// export function useInactivityLogout(timeoutMs = 30 * 60 * 1000) {
//   const { logout } = useAuth();
//   useEffect(() => {
//     let timer = setTimeout(logout, timeoutMs);
//     const reset = () => { clearTimeout(timer); timer = setTimeout(logout, timeoutMs); };
//     const events = ['mousemove', 'keydown', 'click', 'touchstart'];
//     events.forEach(e => window.addEventListener(e, reset));
//     return () => {
//       clearTimeout(timer);
//       events.forEach(e => window.removeEventListener(e, reset));
//     };
//   }, [logout, timeoutMs]);
// }
>>>>>>> fb1bb19 (refactor: update Sidebar and Dashboard components to remove Raw Materials references)
