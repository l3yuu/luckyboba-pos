import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  // Wait for the 'checkAuth' inside useAuth to finish
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b2063]"></div>
      </div>
    );
  }

  // If loading is done and there is still no user, send to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user exists, show the Dashboard (Outlet)
  return <Outlet />;
};