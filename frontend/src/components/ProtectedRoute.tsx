import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo.png';

type Role = 'superadmin' | 'admin' | 'manager' | 'cashier';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

const ROLE_HOME: Record<string, string> = {
  superadmin:     '/super-admin',
  admin:          '/dashboard',
  manager:        '/branch-manager',
  branch_manager: '/branch-manager',
  cashier:        '/dashboard',
};

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // ── CRITICAL: never make any routing decision while auth is resolving ────
  // Without this, the very first render (where user=null, isLoading=true)
  // would fire the "not logged in" redirect to /login — causing the blink.
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f6ff]">
        <div className="relative flex flex-col items-center">
          <img
            src={logo}
            alt="Lucky Boba"
            className="h-16 w-auto object-contain animate-pulse mb-6 opacity-80"
          />
          <div className="w-12 h-12 border-4 border-zinc-200 border-t-[#3b2063] rounded-full animate-spin" />
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  // ── Not logged in (confirmed — isLoading is false) ───────────────────────
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── Role check ───────────────────────────────────────────────────────────
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole  = (user.role as string ?? '').toLowerCase().trim();
    const hasAccess = allowedRoles.includes(userRole as Role);

    if (!hasAccess) {
      const redirectTo = ROLE_HOME[userRole] ?? '/login';

      // Safety: if somehow we're already at the redirect target, just render.
      // This prevents any possible infinite redirect loop.
      if (location.pathname === redirectTo) {
        return <Outlet />;
      }

      return <Navigate to={redirectTo} replace />;
    }
  }

  return <Outlet />;
};