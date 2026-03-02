import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

type Role = 'superadmin' | 'admin' | 'manager' | 'cashier';

const ROLE_HOME: Record<string, string> = {
  superadmin: '/super-admin',
  admin:      '/dashboard',
  manager:    '/branch-manager',
  cashier:    '/dashboard',
};

/**
 * Use this hook inside your Login page component.
 *
 * If the user is already authenticated when they land on /login,
 * this immediately sends them to their correct dashboard — preventing
 * the back-button loop where a logged-in user can see the login page.
 */
export const useAuthRedirect = () => {
  const { user, isLoading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    if (isLoading) return; // wait for checkAuth to finish
    if (!user)    return; // not logged in — stay on /login

    const userRole   = (user.role as string ?? '').toLowerCase().trim() as Role;
    const roleHome   = ROLE_HOME[userRole] ?? '/dashboard';

    // If they were bounced to /login from a protected route,
    // 'from' is stored in location.state — send them back there.
    const intended   = (location.state as { from?: { pathname: string } })?.from?.pathname;
    const destination = intended && intended !== '/login' ? intended : roleHome;

    navigate(destination, { replace: true });
  }, [user, isLoading, navigate, location.state]);
};