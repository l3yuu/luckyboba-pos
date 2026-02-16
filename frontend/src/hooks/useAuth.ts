import api from '../services/api';
import { useState, useEffect, useCallback } from 'react'; 
import axios from 'axios'; 
import type { LoginCredentials, User } from '../types/user'; 

export type UserRole = 'superadmin' | 'admin' | 'manager';

export interface LoginResult {
  success: boolean;
  role?: UserRole;
}

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

<<<<<<< HEAD
    const checkAuth = useCallback(async (): Promise<User | null> => {
        // We now check for the token instead of just a boolean string
        const token = localStorage.getItem('lucky_boba_token');
        
        if (!token) {
            setIsLoading(false);
            return null;
        }
=======
  const login = async (email: string, pass: string): Promise<boolean | 'superadmin'> => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
>>>>>>> 9057bc1bbe00a3ae4125184c77f2d07a9d510873

        try {
            const response = await api.get('/user');
            const userData = response.data;
            setUser(userData);
            return userData;
        } catch {
            localStorage.removeItem('lucky_boba_token');
            localStorage.removeItem('lucky_boba_authenticated');
            setUser(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

<<<<<<< HEAD
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);
=======
    // Super Admin credentials
    const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'superadmin@luckyboba.com';
    const SUPER_ADMIN_PASSWORD = import.meta.env.VITE_SUPER_ADMIN_PASSWORD || 'superadmin123';

    if (email === SUPER_ADMIN_EMAIL && pass === SUPER_ADMIN_PASSWORD) {
      localStorage.setItem('auth_token', 'mock-boba-token-123');
      sessionStorage.setItem('super_admin_authenticated', 'true');
      setIsSuccess(true);
      setIsLoading(false);
      return 'superadmin';
    }

    // Regular admin credentials
    if (email === 'admin@luckyboba.com' && pass === 'password123') {
      localStorage.setItem('auth_token', 'mock-boba-token-123');
      setIsSuccess(true);
      setIsLoading(false);
      return true;
    }

    setError('Invalid credentials. Try admin@luckyboba.com / password123 or superadmin@luckyboba.com / superadmin123');
    setIsLoading(false);
    return false;
  };
>>>>>>> 9057bc1bbe00a3ae4125184c77f2d07a9d510873

    const login = async (credentials: LoginCredentials): Promise<User | null> => {
        setIsLoading(true);
        setError(null);
        
        try {
            // STEP 1: No more sanctum/csrf-cookie call! 
            // We go straight to login.
            const response = await api.post('/login', credentials);
            
            // STEP 2: Capture the token and user from our new controller response
            const { token, user: userData } = response.data;
            
            // STEP 3: Store them
            localStorage.setItem('lucky_boba_token', token);
            localStorage.setItem('lucky_boba_authenticated', 'true');
            
            setUser(userData);
            return userData;
        } catch (err: unknown) { 
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Invalid credentials.');
            } else {
                setError('An unexpected error occurred');
            }
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
            // Always clear storage even if the API call fails
            localStorage.removeItem('lucky_boba_token');
            localStorage.removeItem('lucky_boba_authenticated');
            setUser(null);
        }
    };

    return { login, logout, isLoading, error, user };
};
