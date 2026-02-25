import { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import type { LoginCredentials, User } from '../types/user';
import axios from 'axios';

const AUTH_KEYS = [
  'lucky_boba_token',
  'lucky_boba_authenticated',
  'lucky_boba_user_name',
  'lucky_boba_user_role',
  'dashboard_stats',
  'dashboard_stats_timestamp'
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
  const [isLoading, setIsLoading] = useState<boolean>(() => !!localStorage.getItem('lucky_boba_token'));
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('lucky_boba_token');
    const name = localStorage.getItem('lucky_boba_user_name');
    const role = localStorage.getItem('lucky_boba_user_role');
    if (token && name) return { name, role: role || 'cashier' } as User;
    return null;
  });

  const clearSession = useCallback(() => {
    AUTH_KEYS.forEach(key => localStorage.removeItem(key));
    ['cashier_menu_unlocked', 'cashier_lock_date'].forEach(k => localStorage.removeItem(k));
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
      const response = await api.get('/user');
      const userData = response.data;
      localStorage.setItem('lucky_boba_user_name', userData.name);
      localStorage.setItem('lucky_boba_user_role', userData.role || 'cashier');
      setUser(userData);
    } catch {
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
  }, [checkAuth, clearSession]);

  const login = async (credentials: LoginCredentials): Promise<User | null> => {
    const lockoutEnd = localStorage.getItem('login_lockout_end');
    if (lockoutEnd) {
      const remaining = parseInt(lockoutEnd) - Date.now();
      if (remaining > 0) {
        setError(`Too many attempts. Please wait ${Math.ceil(remaining / 60000)} minute(s).`);
        return null;
      }
      localStorage.removeItem('login_lockout_end');
      localStorage.removeItem('login_attempts');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/login', credentials);
      if (response.data.success === false) throw new Error(response.data.message || 'Invalid credentials.');

      const { token, user: userData } = response.data;
      localStorage.setItem('lucky_boba_token', token);
      localStorage.setItem('lucky_boba_authenticated', 'true');
      localStorage.setItem('lucky_boba_user_name', userData.name);
      localStorage.setItem('lucky_boba_user_role', userData.role || 'cashier');
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('login_lockout_end');

      setUser(userData);
      return userData;
    } catch (err: unknown) {
      const attempts = parseInt(localStorage.getItem('login_attempts') || '0') + 1;
      localStorage.setItem('login_attempts', attempts.toString());

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        localStorage.setItem('login_lockout_end', (Date.now() + LOCKOUT_DURATION).toString());
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
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/logout');
    } catch {
      // continue regardless
    } finally {
      clearSession(); // ✅ sets user = null in the ONE shared instance
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


export { AuthContext };

