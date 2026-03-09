import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import type { LoginCredentials, User } from '../types/user';
import axios from 'axios';

const AUTH_KEYS = [
  'lucky_boba_token',
  'lucky_boba_user_name',
  'lucky_boba_user_role',
  'lucky_boba_user_branch',
  'dashboard_stats',
  'dashboard_stats_timestamp',
];

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 2 * 60 * 1000;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // ✅ FIX 1: Always start loading if a token exists — never trust localStorage user directly
  const [isLoading, setIsLoading] = useState<boolean>(
    () => !!localStorage.getItem('lucky_boba_token')
  );
  const [error, setError] = useState<string | null>(null);

  // ✅ FIX 2: Always start as null — wait for server to confirm before setting user
  const [user, setUser] = useState<User | null>(null);

  const clearSession = useCallback(() => {
    AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
    ['cashier_menu_unlocked', 'cashier_lock_date'].forEach((k) =>
      localStorage.removeItem(k)
    );
    sessionStorage.clear();
    setUser(null);
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('lucky_boba_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      // ✅ FIX 3: Only set user AFTER server confirms the token is valid
      const response = await api.get('/user');
      const userData = response.data;
      localStorage.setItem('lucky_boba_user_name', userData.name);
      localStorage.setItem('lucky_boba_user_role', userData.role || 'cashier');
      localStorage.setItem('lucky_boba_user_branch', userData.branch_name ?? '');
      setUser(userData);
    } catch {
      // Token is invalid/expired — clear everything and send to login
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) clearSession();
        return Promise.reject(error);
      }
    );

    checkAuth();

    return () => api.interceptors.response.eject(interceptor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<User | null> => {
    setError(null);

    const lockoutEnd = localStorage.getItem('login_lockout_end');
    if (lockoutEnd) {
      const remaining = parseInt(lockoutEnd) - Date.now();
      if (remaining > 0) {
        setError(
          `Too many attempts. Please wait ${Math.ceil(remaining / 60000)} minute(s).`
        );
        return null;
      }
      localStorage.removeItem('login_lockout_end');
      localStorage.removeItem('login_attempts');
    }

    setIsLoading(true);

    try {
      const response = await api.post('/login', credentials);
      if (response.data.success === false)
        throw new Error(response.data.message || 'Invalid credentials.');

      const { token, user: userData } = response.data;
      localStorage.setItem('lucky_boba_token', token);
      localStorage.setItem('lucky_boba_user_name', userData.name);
      localStorage.setItem('lucky_boba_user_role', userData.role || 'cashier');
      localStorage.setItem('lucky_boba_user_branch', userData.branch_name ?? '');
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('login_lockout_end');

      setUser(userData);
      return userData;
    } catch (err: unknown) {
      const attempts =
        parseInt(localStorage.getItem('login_attempts') || '0') + 1;
      localStorage.setItem('login_attempts', attempts.toString());

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        localStorage.setItem(
          'login_lockout_end',
          (Date.now() + LOCKOUT_DURATION).toString()
        );
        setError('Too many failed attempts. Please wait 2 minutes.');
        return null;
      }

      clearSession();

      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Invalid credentials.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post('/logout');
    } catch {
      // continue regardless
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, isLoading, error, login, logout }),
    [user, isLoading, error, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };