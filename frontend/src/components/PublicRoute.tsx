import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME } from '../utils/roleRoutes';

export const PublicRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (user) {
    // Redirect to the correct home page based on their role
    const role = (user.role as string ?? '').toLowerCase().trim();
    const redirectTo = ROLE_HOME[role] ?? '/login';
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};