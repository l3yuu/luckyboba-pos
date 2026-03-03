import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { ROLE_HOME } from '../utils/roleRoutes';

type Role = 'superadmin' | 'admin' | 'manager' | 'cashier';

export const useAuthRedirect = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!user)    return;

    const userRole    = (user.role as string ?? '').toLowerCase().trim() as Role;
    const roleHome    = ROLE_HOME[userRole] ?? '/dashboard';
    const intended    = (location.state as { from?: { pathname: string } })?.from?.pathname;
    const destination = intended && intended !== '/login' ? intended : roleHome;

    navigate(destination, { replace: true });
  }, [user, isLoading, navigate, location.state]);
};