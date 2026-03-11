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
  'lucky_boba_user_branch_id',
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
  const [isLoading, setIsLoading] = useState<boolean>(
    () => !!localStorage.getItem('lucky_boba_token')
  );
  const [error, setError] = useState<string | null>(null);
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
      const response = await api.get('/user');
      const userData = response.data;
      localStorage.setItem('lucky_boba_user_name', userData.name);
      localStorage.setItem('lucky_boba_user_role', userData.role || 'cashier');
      localStorage.setItem('lucky_boba_user_branch', userData.branch_name ?? '');
      localStorage.setItem('lucky_boba_user_branch_id', String(userData.branch_id ?? ''));
      setUser(userData);
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    // api.ts already handles 401 globally — no duplicate interceptor needed here
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<User | null> => {
    setError(null);

    // Check lockout
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

      // Some backends return 200 with success: false
      if (response.data.success === false) {
        throw new Error(response.data.message || 'Invalid credentials.');
      }

      const { token, user: userData } = response.data;
      localStorage.setItem('lucky_boba_token', token);
      localStorage.setItem('lucky_boba_user_name', userData.name);
      localStorage.setItem('lucky_boba_user_role', userData.role || 'cashier');
      localStorage.setItem('lucky_boba_user_branch', userData.branch_name ?? '');
      localStorage.setItem('lucky_boba_user_branch_id', String(userData.branch_id ?? ''));
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('login_lockout_end');

      setUser(userData);
      return userData;

    } catch (err: unknown) {
      // Track failed attempts
      const attempts = parseInt(localStorage.getItem('login_attempts') || '0') + 1;
      localStorage.setItem('login_attempts', attempts.toString());

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        localStorage.setItem(
          'login_lockout_end',
          (Date.now() + LOCKOUT_DURATION).toString()
        );
        setError('Too many failed attempts. Please wait 2 minutes.');
        return null;
      }

      // ✅ KEY FIX: Do NOT call clearSession() here — it wipes state and can
      // interfere with error display. Only set the error message.
      let message = 'Invalid email or password.';

      if (axios.isAxiosError(err)) {
        // Laravel returns { message: '...' } on 401/422
        message = err.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
      throw new Error(message); // ← let caller catch directly, no state timing issues

    } finally {
      setIsLoading(false);
    }
  }, []);

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