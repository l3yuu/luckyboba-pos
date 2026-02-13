import { useState } from 'react';

export type UserRole = 'superadmin' | 'admin' | 'manager';

export interface LoginResult {
  success: boolean;
  role?: UserRole;
}

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const login = async (email: string, pass: string): Promise<LoginResult> => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    // Mock network delay (1.5s)
    await new Promise((resolve) => setTimeout(resolve, 1500));

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
