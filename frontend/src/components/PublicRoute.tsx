import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const PublicRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or your loading spinner
  }

  // If user is logged in, redirect them to dashboard
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
};