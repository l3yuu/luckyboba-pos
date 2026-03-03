import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo.png'; // Adding your logo for a branded feel

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  // Wait for the 'checkAuth' inside useAuth to finish
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f6ff]">
        <div className="relative flex flex-col items-center">
          {/* Branded Logo with a gentle pulse instead of just a spinner */}
          <img 
            src={logo} 
            alt="Lucky Boba" 
            className="h-16 w-auto object-contain animate-pulse mb-6 opacity-80" 
          />
          
          {/* Clean custom spinner matching your dashboard purple */}
          <div className="w-12 h-12 border-4 border-zinc-200 border-t-[#3b2063] rounded-full animate-spin"></div>
          
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  // If loading is done and there is still no user, send to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user exists, show the child routes (Dashboard/POS)
  return <Outlet />;
};