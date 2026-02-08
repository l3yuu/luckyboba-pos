// src/hooks/useAuth.ts
import api from '../services/api';
import { useState, useEffect, useCallback } from 'react'; // Added useEffect and useCallback
import axios from 'axios'; 
import type { LoginCredentials, User } from '../types/user'; 

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true); // Start as true for the initial check
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // Function to check if a session cookie already exists and is valid
    const checkAuth = useCallback(async () => {
        try {
            const response = await api.get('/api/user');
            setUser(response.data);
            return true;
        } catch {
            setUser(null);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Run the check on initial mount (page refresh)
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (credentials: LoginCredentials): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        
        try {
            await api.get('/sanctum/csrf-cookie');
            await api.post('/login', credentials);
            
            // After successful login, fetch the full user object
            const success = await checkAuth();
            return success; 
        } catch (err: unknown) { 
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Invalid credentials.');
            } else {
                setError('An unexpected error occurred');
            }
            setIsLoading(false); // Manually set false here since checkAuth won't run on error
            return false;
        }
    };

    const logout = async (): Promise<boolean> => {
        try {
            await api.post('/logout');
            setUser(null);
            return true;
        } catch (err) {
            console.error("Logout failed", err);
            return false;
        }
    };

    return { login, logout, isLoading, error, user };
};