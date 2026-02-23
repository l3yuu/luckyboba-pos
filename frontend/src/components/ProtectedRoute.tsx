import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo.png';

interface ProtectedRouteProps {
  allowedRoles?: Array<'superadmin' | 'admin' | 'manager' | 'cashier'>;
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // ── Loading state: wait for checkAuth to finish
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

  // ── Not authenticated → redirect to login, preserving intended destination
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── Role-based access: if roles are specified, check the user has one
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role as string;
    const hasAccess = allowedRoles.includes(userRole as 'superadmin' | 'admin' | 'manager' | 'cashier');

    if (!hasAccess) {
      // Redirect to appropriate dashboard based on role
      const roleRedirects: Record<string, string> = {
        superadmin: '/super-admin',
        admin: '/dashboard',
        manager: '/branch-manager',
        cashier: '/dashboard',
      };
      const redirectTo = roleRedirects[userRole] ?? '/dashboard';

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f6ff] p-6 font-sans">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-zinc-100 p-10 max-w-sm w-full text-center space-y-6">
            <img src={logo} alt="Lucky Boba" className="h-12 w-auto object-contain mx-auto opacity-60" />
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#d97706" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[#3b2063] font-black uppercase text-lg tracking-tight mb-2">Access Restricted</h2>
              <p className="text-zinc-400 text-sm font-medium">
                Your role <span className="font-black text-[#3b2063]">({userRole})</span> does not have permission to view this page.
              </p>
            </div>
            <Navigate to={redirectTo} replace />
          </div>
        </div>
      );
    }
  }

  // ── All checks passed → render the protected child routes
  return <Outlet />;
};
