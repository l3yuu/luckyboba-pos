import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
  // Logic: Check if a token exists in localStorage
  const isAuthenticated = !!localStorage.getItem('auth_token');

  if (!isAuthenticated) {
    // replace={true} prevents the user from clicking "back" into the private area
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};