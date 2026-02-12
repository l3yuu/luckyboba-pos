// src/hooks/useAuth.ts
import api from '../services/api';
import { useState, useEffect, useCallback } from 'react'; 
import axios from 'axios'; 
import type { LoginCredentials, User } from '../types/user'; 

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    const checkAuth = useCallback(async (): Promise<User | null> => {
        if (localStorage.getItem('lucky_boba_authenticated') !== 'true') {
            setIsLoading(false);
            return null;
        }

        try {
            // baseURL is already .../api, so we just use '/user'
            const response = await api.get('/user');
            const userData = response.data;
            setUser(userData);
            return userData;
        } catch {
            localStorage.removeItem('lucky_boba_authenticated');
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
            // 1. Get the CSRF Cookie 
            // '../' moves up from .../api to the root .../sanctum/csrf-cookie
            await api.get('../sanctum/csrf-cookie');
            
            // 2. Perform Login 
            // Removed the extra '/api' because it's already in your baseURL
            await api.post('/login', credentials);
            
            localStorage.setItem('lucky_boba_authenticated', 'true');
            
            // 3. Fetch the actual user data
            const authenticatedUser = await checkAuth();
            return authenticatedUser; 
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
            // Removed the extra '/api' to prevent .../api/api/logout
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