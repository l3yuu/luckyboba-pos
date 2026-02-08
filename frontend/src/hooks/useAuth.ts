// src/hooks/useAuth.ts
import api from '../services/api';
import { useState, useEffect, useCallback } from 'react'; 
import axios from 'axios'; // Add this back for the isAxiosError check
import type { LoginCredentials, User } from '../types/user'; 

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    const checkAuth = useCallback(async () => {
        if (localStorage.getItem('lucky_boba_authenticated') !== 'true') {
            setIsLoading(false);
            return false;
        }

        try {
            const response = await api.get('/api/user');
            setUser(response.data);
            return true;
        } catch {
            localStorage.removeItem('lucky_boba_authenticated');
            setUser(null);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (credentials: LoginCredentials): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        
        try {
            await api.get('/sanctum/csrf-cookie');
            await api.post('/login', credentials);
            
            localStorage.setItem('lucky_boba_authenticated', 'true');
            
            const success = await checkAuth();
            return success; 
        } catch (err: unknown) { 
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Invalid credentials.');
            } else {
                setError('An unexpected error occurred');
            }
            setIsLoading(false);
            return false;
        }
    };

    const logout = async (): Promise<boolean> => {
        try {
            await api.post('/logout');
            localStorage.removeItem('lucky_boba_authenticated');
            setUser(null);
            return true;
        } catch {
            return false;
        }
    };

    return { login, logout, isLoading, error, user };
};