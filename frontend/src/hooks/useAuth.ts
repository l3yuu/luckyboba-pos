import { useState } from 'react';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const login = async (email: string, pass: string): Promise<boolean | 'superadmin'> => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    // Mock network delay (1.5s)
    await new Promise((resolve) => setTimeout(resolve, 1500));

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

  // --- ADD A LOGOUT FUNCTION ---
  const logout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login'; 
  };

  return { login, logout, isLoading, error, isSuccess };
};