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
  'lucky_boba_user_id',
  'lucky_boba_user_branch_vat',   
  'dashboard_stats',
  'dashboard_stats_timestamp',
];

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION   = 2 * 60 * 1000;

interface AuthContextType {
  user:      User | null;
  isLoading: boolean;
  isInitialAuthCheck: boolean;
  error:     string | null;
  login:     (credentials: LoginCredentials) => Promise<User | { requires_2fa: true } | null>;
  verify2FA: (credentials: LoginCredentials, code: string) => Promise<User | null>;
  resend2FA: (credentials: LoginCredentials) => Promise<boolean>;
  logout:    () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState<boolean>(
    () => !!localStorage.getItem('lucky_boba_token')
  );
  const [isInitialAuthCheck, setIsInitialAuthCheck] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user,  setUser]  = useState<User | null>(null);

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
      setIsInitialAuthCheck(false);
      setIsLoading(false);
      return;
    }
    try {
      const response = await api.get('/user');
      const userData  = response.data;
      localStorage.setItem('lucky_boba_user_name',      userData.name);
      localStorage.setItem('lucky_boba_user_role',      userData.role || 'cashier');
      localStorage.setItem('lucky_boba_user_branch',    userData.branch_name ?? '');
      localStorage.setItem('lucky_boba_user_branch_id', String(userData.branch_id ?? ''));
      localStorage.setItem('lucky_boba_user_branch_vat', userData.branch_vat_type ?? 'vat');
      setUser(userData);
    } catch {
      clearSession();
    } finally {
      setIsInitialAuthCheck(false);
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<User | { requires_2fa: true } | null> => {
    setError(null);

    // ── Lockout check ───────────────────────────────────────────────────────
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

    try {
      const response = await api.post('/login', credentials);

      if (response.data.success === false) {
        throw new Error(response.data.message || 'Invalid credentials.');
      }

      const { requires_2fa, token, user: userData, pos_number, branch_id } = response.data;

      if (requires_2fa) {
        return { requires_2fa: true };
      }

      // ── Persist auth ──────────────────────────────────────────────────────
      localStorage.setItem('lucky_boba_token',          token);
      localStorage.setItem('lucky_boba_user_name',      userData.name);
      localStorage.setItem('lucky_boba_user_role',      userData.role || 'cashier');
      localStorage.setItem('lucky_boba_user_branch',    userData.branch_name ?? '');
      localStorage.setItem('lucky_boba_user_branch_id', String(userData.branch_id ?? ''));
      localStorage.setItem('lucky_boba_user_id',        String(userData.id));
      localStorage.setItem('lucky_boba_user_branch_vat', userData.branch_vat_type ?? 'vat');
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('login_lockout_end');

      // ── Persist device session — DeviceGate handles the actual check ──────
      sessionStorage.setItem('pos_number', pos_number ?? '');
      sessionStorage.setItem('branch_id',  String(branch_id ?? ''));
      // ─────────────────────────────────────────────────────────────────────

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

      let message = 'Invalid email or password.';
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
      throw new Error(message);

    } finally {
      setIsLoading(false);
    }
  }, []);

  const verify2FA = useCallback(async (credentials: LoginCredentials, code: string): Promise<User | null> => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post('/verify-2fa', { ...credentials, code });

      if (response.data.success === false) {
        throw new Error(response.data.message || 'Invalid or expired 2FA code.');
      }

      const { token, user: userData, pos_number, branch_id } = response.data;

      localStorage.setItem('lucky_boba_token',          token);
      localStorage.setItem('lucky_boba_user_name',      userData.name);
      localStorage.setItem('lucky_boba_user_role',      userData.role || 'cashier');
      localStorage.setItem('lucky_boba_user_branch',    userData.branch_name ?? '');
      localStorage.setItem('lucky_boba_user_branch_id', String(userData.branch_id ?? ''));
      localStorage.setItem('lucky_boba_user_id',        String(userData.id));
      localStorage.setItem('lucky_boba_user_branch_vat', userData.branch_vat_type ?? 'vat');
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('login_lockout_end');

      sessionStorage.setItem('pos_number', pos_number ?? '');
      sessionStorage.setItem('branch_id',  String(branch_id ?? ''));

      setUser(userData);
      return userData;

    } catch (err: unknown) {
      let message = 'Verification failed.';
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resend2FA = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await api.post('/resend-2fa', credentials);
      if (response.data.success === false) {
        throw new Error(response.data.message || 'Failed to resend code.');
      }
      return true;
    } catch (err: unknown) {
      let message = 'Resend failed.';
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      throw new Error(message);
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
    () => ({ user, isLoading, isInitialAuthCheck, error, login, verify2FA, resend2FA, logout }),
    [user, isLoading, isInitialAuthCheck, error, login, verify2FA, resend2FA, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };