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
  const login = async (email: string, pass: string): Promise<LoginResult> => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
>>>>>>> a2a3299b2bae9a81ab929daa70987c9e0871e40c

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
=======
    // Super Admin account
    if (email === 'superadmin@luckyboba.com' && pass === 'super123') {
      localStorage.setItem('auth_token', 'mock-superadmin-token-456');
      localStorage.setItem('user_role', 'superadmin');
      
      setIsSuccess(true);
      setIsLoading(false);
      return { success: true, role: 'superadmin' };
    }

    // Regular Admin account
    if (email === 'admin@luckyboba.com' && pass === 'password123') {
      localStorage.setItem('auth_token', 'mock-boba-token-123');
      localStorage.setItem('user_role', 'admin');
      
      setIsSuccess(true);
      setIsLoading(false);
      return { success: true, role: 'admin' };
    }

    setError('Invalid credentials.');
    setIsLoading(false);
    return { success: false };
  };

  // --- ADD A LOGOUT FUNCTION ---
  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    window.location.href = '/login'; 
  };

  // Get current user role
  const getUserRole = (): UserRole | null => {
    return localStorage.getItem('user_role') as UserRole | null;
  };

  return { login, logout, isLoading, error, isSuccess, getUserRole };
};
>>>>>>> a2a3299b2bae9a81ab929daa70987c9e0871e40c
