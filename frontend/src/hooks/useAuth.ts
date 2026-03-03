"use client"

import api from '../services/api';
import { useState, useEffect, useCallback } from 'react'; 
import axios from 'axios'; 
import type { LoginCredentials, User } from '../types/user'; 

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

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState<boolean>(() => !localStorage.getItem('lucky_boba_token'));
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(() => {
        const token = localStorage.getItem('lucky_boba_token');
        const name = localStorage.getItem('lucky_boba_user_name');
        const role = localStorage.getItem('lucky_boba_user_role');
        if (token && name) {
            return { name, role: role || 'cashier' } as User;
        }
        return null;
    });

    const clearSession = useCallback(() => {
        AUTH_KEYS.forEach(key => localStorage.removeItem(key));
        setUser(null);
    }, []);

    const checkAuth = useCallback(async (): Promise<User | null> => {
        const token = localStorage.getItem('lucky_boba_token');
        
        if (!token) {
            setIsLoading(false);
            return null;
        }

        try {
            const response = await api.get('/user');
            const userData = response.data;
            
            // Sync localStorage if user name changed on backend
            localStorage.setItem('lucky_boba_user_name', userData.name);
            localStorage.setItem('lucky_boba_user_role', userData.role || 'cashier');
            
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
                // Suppress unhandled network errors from polluting the console
                return Promise.reject(error);
            }
        );

        checkAuth();

        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, [checkAuth, clearSession]);

    const login = async (credentials: LoginCredentials): Promise<User | null> => {
        // Check for client-side rate limiting
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
            if (response.data.success === false) {
                throw new Error(response.data.message || 'Invalid credentials.');
            }

            const { token, user: userData } = response.data;
            
            // PERSIST AUTH DATA
            localStorage.setItem('lucky_boba_token', token);
            localStorage.setItem('lucky_boba_authenticated', 'true');
            localStorage.setItem('lucky_boba_user_name', userData.name);
            localStorage.setItem('lucky_boba_user_role', userData.role || 'cashier');
            
            localStorage.removeItem('login_attempts');
            localStorage.removeItem('login_lockout_end');

            setUser(userData);
            setIsLoading(false);
            return userData;

        } catch (err: unknown) { 
            // Handle failed attempts safely
            const attempts = parseInt(localStorage.getItem('login_attempts') || '0') + 1;
            localStorage.setItem('login_attempts', attempts.toString());

            if (attempts >= MAX_LOGIN_ATTEMPTS) {
                localStorage.setItem('login_lockout_end', (Date.now() + LOCKOUT_DURATION).toString());
                setError('Too many failed attempts. Please wait 2 minutes.');
                setIsLoading(false);
                return null;
            }

            clearSession();
            
            // Update error mapping to catch our custom Error thrown above
            if (axios.isAxiosError(err)) {
                if (!err.response) {
                    setError('Unable to connect. Please try again later.');
                } else {
                    setError(err.response.data?.message || 'Invalid credentials.');
                }
            } else if (err instanceof Error) {
                if (err.message === 'network_error') {
                    setError('Unable to connect. Please try again later.');
                } else {
                    setError(err.message);
                }
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
            clearSession();
        }
    };

    return { login, logout, isLoading, error, user };
};