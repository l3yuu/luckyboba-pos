import api from '../services/api';
import { useState, useEffect, useCallback } from 'react'; 
import axios from 'axios'; 
import type { LoginCredentials, User } from '../types/user'; 
// Remove this line: import type { DashboardData } from '../types/dashboard';

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    const checkAuth = useCallback(async (): Promise<User | null> => {
        const token = localStorage.getItem('lucky_boba_token');
        
        if (!token) {
            setIsLoading(false);
            return null;
        }

        try {
            const response = await api.get('/user');
            const userData = response.data;
            setUser(userData);
            return userData;
        } catch {
            localStorage.removeItem('lucky_boba_token');
            localStorage.removeItem('lucky_boba_authenticated');
            localStorage.removeItem('dashboard_stats');
            localStorage.removeItem('dashboard_stats_timestamp');
            setUser(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (credentials: LoginCredentials): Promise<User | null> => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await api.post('/login', credentials);
            
            const { token, user: userData, dashboard_stats } = response.data;
            
            // Store token and user
            localStorage.setItem('lucky_boba_token', token);
            localStorage.setItem('lucky_boba_authenticated', 'true');
            
            // Store dashboard stats from login response
            if (dashboard_stats) {
                localStorage.setItem('dashboard_stats', JSON.stringify(dashboard_stats));
                localStorage.setItem('dashboard_stats_timestamp', Date.now().toString());
            }
            
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
            // Clear all storage
            localStorage.removeItem('lucky_boba_token');
            localStorage.removeItem('lucky_boba_authenticated');
            localStorage.removeItem('dashboard_stats');
            localStorage.removeItem('dashboard_stats_timestamp');
            setUser(null);
        }
    };

    return { login, logout, isLoading, error, user };
};