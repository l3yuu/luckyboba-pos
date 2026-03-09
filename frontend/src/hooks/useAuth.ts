"use client"

import api from '../services/api';
import { useState, useEffect, useCallback } from 'react'; 
import axios from 'axios'; 
import type { LoginCredentials, User } from '../types/user'; 

// ✅ CHANGED: Use sessionStorage instead of localStorage for auth tokens
// sessionStorage auto-clears when browser/tab closes — safer for POS terminals
const storage = {
    get: (key: string) => sessionStorage.getItem(key),
    set: (key: string, val: string) => sessionStorage.setItem(key, val),
    remove: (key: string) => sessionStorage.removeItem(key),
};

const AUTH_KEYS = [
    'lucky_boba_token',
    'lucky_boba_authenticated',
    'lucky_boba_user_name',
    'lucky_boba_user_role',
];

export const useAuth = () => {
    // ✅ CHANGED: read from sessionStorage instead of localStorage
    const [isLoading, setIsLoading] = useState<boolean>(() => !storage.get('lucky_boba_token'));
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
        // ✅ CHANGED: clear from sessionStorage
        AUTH_KEYS.forEach(key => storage.remove(key));
        setUser(null);
    }, []);

    const checkAuth = useCallback(async (): Promise<User | null> => {
        const token = storage.get('lucky_boba_token'); // ✅ CHANGED
        
        if (!token) {
            setIsLoading(false);
            return null;
        }

        try {
            const response = await api.get('/user');
            const userData = response.data;
            
            // ✅ CHANGED: sync to sessionStorage
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
                    // ✅ Backend rate limit hit
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