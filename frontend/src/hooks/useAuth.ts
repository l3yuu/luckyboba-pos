import { useState } from 'react';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    // Mock network delay (1.5s)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simple check
    if (email === 'admin@luckyboba.com' && pass === 'password123') {
      setIsSuccess(true);
      setIsLoading(false);
      return true;
    } else {
      setError('Invalid credentials. Try admin@luckyboba.com / password123');
      setIsLoading(false);
      return false;
    }
  };

  return { login, isLoading, error, isSuccess };
};