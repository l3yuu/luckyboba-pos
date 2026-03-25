import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import type { LoginCredentials, User } from '../types/user';
import { getDeviceIdAsync } from '../utils/deviceId'; // ← updated import
import axios from 'axios';

const AUTH_KEYS = [
  'lucky_boba_token',
  'lucky_boba_user_name',
  'lucky_boba_user_role',
  'lucky_boba_user_branch',
  'lucky_boba_user_branch_id',
  'lucky_boba_user_id',
  'dashboard_stats',
  'dashboard_stats_timestamp',
];

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION   = 2 * 60 * 1000;

interface AuthContextType {
  user:      User | null;
  isLoading: boolean;
  error:     string | null;
  login:     (credentials: LoginCredentials) => Promise<User | null>;
  logout:    () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState<boolean>(
    () => !!localStorage.getItem('lucky_boba_token')
  );
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
    if (!token) { setIsLoading(false); return; }
    try {
      const response = await api.get('/user');
      const userData  = response.data;
      localStorage.setItem('lucky_boba_user_name',      userData.name);
      localStorage.setItem('lucky_boba_user_role',      userData.role || 'cashier');
      localStorage.setItem('lucky_boba_user_branch',    userData.branch_name ?? '');
      localStorage.setItem('lucky_boba_user_branch_id', String(userData.branch_id ?? ''));
      setUser(userData);
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<User | null> => {
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

      const { token, user: userData, pos_number, branch_id } = response.data;

      // ── Persist auth ──────────────────────────────────────────────────────
      localStorage.setItem('lucky_boba_token',          token);
      localStorage.setItem('lucky_boba_user_name',      userData.name);
      localStorage.setItem('lucky_boba_user_role',      userData.role || 'cashier');
      localStorage.setItem('lucky_boba_user_branch',    userData.branch_name ?? '');
      localStorage.setItem('lucky_boba_user_branch_id', String(userData.branch_id ?? ''));
      localStorage.setItem('lucky_boba_user_id',        String(userData.id));
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('login_lockout_end');

      // ── Cashier device-pairing check ──────────────────────────────────────
      // Only cashiers are device-locked. All other roles skip this entirely.
      if (userData.role === 'cashier') {
        try {
          // ── Resolve hardware-derived device ID (survives site data clear) ──
          const deviceName = await getDeviceIdAsync();

          const deviceCheck = await api.post('/devices/check', {
            device_name: deviceName, // ← always a real string, never undefined
            user_id:     userData.id,
          });

          if (!deviceCheck.data.success) {
            // Auth succeeded but device pairing failed — roll back session
            clearSession();
            const msg = deviceCheck.data.message || 'This device is not assigned to your account.';
            setError(msg);
            throw new Error(msg);
          }

          // Store device info from check response
          sessionStorage.setItem('pos_number', deviceCheck.data.pos_number ?? '');
          sessionStorage.setItem('branch_id',  String(deviceCheck.data.branch_id ?? ''));

        } catch (deviceErr: unknown) {
          // Re-throw errors we already handled above
          if (deviceErr instanceof Error && deviceErr.message !== 'Network Error') {
            throw deviceErr;
          }
          // Network/unexpected error — fail safe, block login
          clearSession();
          const msg = 'Device verification failed. Please try again.';
          setError(msg);
          throw new Error(msg);
        }

      } else {
        // Non-cashier roles — persist device session directly from login response
        sessionStorage.setItem('pos_number', pos_number  ?? '');
        sessionStorage.setItem('branch_id',  String(branch_id ?? ''));
      }
      // ─────────────────────────────────────────────────────────────────────

      setUser(userData);
      return userData;

    } catch (err: unknown) {
      // Don't increment lockout counter for device-pairing errors
      const isDeviceError = err instanceof Error && (
        err.message.includes('device') ||
        err.message.includes('Device') ||
        err.message.includes('assigned') ||
        err.message.includes('cashier')
      );

      if (!isDeviceError) {
        const attempts = parseInt(localStorage.getItem('login_attempts') || '0') + 1;
        localStorage.setItem('login_attempts', attempts.toString());

        if (attempts >= MAX_LOGIN_ATTEMPTS) {
          localStorage.setItem('login_lockout_end', (Date.now() + LOCKOUT_DURATION).toString());
          setError('Too many failed attempts. Please wait 2 minutes.');
          return null;
        }
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