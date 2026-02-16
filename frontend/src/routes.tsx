import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SalesOrder from './pages/SalesOrder';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

// Helper function to determine default route based on user role
const getDefaultRoute = () => {
  const userRole = localStorage.getItem('user_role');
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    return '/login';
  }
  
  if (userRole === 'superadmin') {
    return '/super-admin';
  }
  
  return '/dashboard';
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    // The Guard: Wraps all protected routes
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
        path: '/pos',
        element: <SalesOrder />,
      },
      {
        path: '/super-admin',
        element: <SuperAdminDashboard />,
      },
    ],
  },
  {
    path: '/',
    element: <Navigate to={getDefaultRoute()} replace />,
  },
  {
    // Catch all - redirect to default route
    path: '*',
    element: <Navigate to={getDefaultRoute()} replace />,
  },
]);
