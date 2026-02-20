import api from '../services/api';
import { useState, useEffect, useCallback } from 'react'; 
import axios from 'axios'; 
import type { LoginCredentials, User } from '../types/user'; 

// Constants to avoid typos - UPDATED to include User Info
const AUTH_KEYS = [
    'lucky_boba_token',
    'lucky_boba_authenticated',
    'lucky_boba_user_name',
    'lucky_boba_user_role',
    'dashboard_stats',
    'dashboard_stats_timestamp'
];

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

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
        checkAuth();
    }, [checkAuth]);

    const login = async (credentials: LoginCredentials): Promise<User | null> => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await api.post('/login', credentials);
            const { token, user: userData, dashboard_stats } = response.data;
            
            // PERSIST AUTH DATA
            localStorage.setItem('lucky_boba_token', token);
            localStorage.setItem('lucky_boba_authenticated', 'true');
            
            // NEW: PERSIST USER INFO FOR NAVBAR
            localStorage.setItem('lucky_boba_user_name', userData.name);
            localStorage.setItem('lucky_boba_user_role', userData.role || 'cashier');
            
            if (dashboard_stats) {
                localStorage.setItem('dashboard_stats', JSON.stringify(dashboard_stats));
                localStorage.setItem('dashboard_stats_timestamp', Date.now().toString());
            }
            
            setUser(userData);
            setIsLoading(false);
            return userData;
        } catch (err: unknown) { 
            clearSession();
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
            clearSession();
        }
    };

    return { login, logout, isLoading, error, user };
};