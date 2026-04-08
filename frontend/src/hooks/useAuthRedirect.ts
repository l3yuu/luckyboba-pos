import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { ROLE_HOME } from '../utils/roleRoutes';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = keyof typeof ROLE_HOME;

type LocationState = {
  from?: { pathname: string };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeRole = (role: string | undefined): Role => {
  return ((role ?? '').toLowerCase().trim() || 'cashier') as Role;
};

const resolveDestination = (
  intendedPath: string | undefined,
  roleHome: string
): string => {
  if (!intendedPath || intendedPath === '/login') return roleHome;
  return intendedPath;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuthRedirect = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading || !user) return;

    const role        = normalizeRole(user.role as string);
    const roleHome    = ROLE_HOME[role] ?? '/dashboard';
    const intended    = (location.state as LocationState)?.from?.pathname;
    const destination = resolveDestination(intended, roleHome);

    navigate(destination, { replace: true });
  }, [user, isLoading, navigate, location.state]);
};